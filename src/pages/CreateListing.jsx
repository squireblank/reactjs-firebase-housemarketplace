import React, { useEffect, useRef, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";
import { toast } from "react-toastify";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.config";
import { v4 as uuidv4 } from "uuid";

const CreateListing = () => {
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);
  const [formData, setFormData] = useState({
    type: "rent",
    name: "",
    bedrooms: 1,
    bathrooms: 1,
    parking: false,
    furnished: false,
    address: "",
    offer: true,
    regularPrice: 0,
    discountedPrice: 0,
    images: [],
    latitude: 0,
    longitude: 0,
    userRef: "",
  });
  const [loading, setLoading] = useState(false);

  // deStructure formData
  const {
    type,
    name,
    bedrooms,
    bathrooms,
    parking,
    furnished,
    address,
    offer,
    regularPrice,
    discountedPrice,
    images,
    latitude,
    longitude,
  } = formData;

  const auth = getAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    if (isMounted) {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setFormData({ ...formData, userRef: user.uid });
        } else {
          navigate("/signin");
        }
      });
    }

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  // handle form data change
  const handleMutate = (e) => {
    // change incoming boolean value from string to actual boolean
    let boolean = null;
    if (e.target.value === "true") {
      boolean = true;
    }
    if (e.target.value === "false") {
      boolean = false;
    }

    // handle text/boolean/numbers data
    if (!e.target.files) {
      setFormData({ ...formData, [e.target.id]: boolean ?? e.target.value });
    }
    // handle file uploads
    if (e.target.files) {
      setFormData({ ...formData, images: e.target.files });
    }
  };

  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // check for discounted price
    if (discountedPrice >= regularPrice) {
      toast.warning("Discounted price should be lower than regular price");
      setLoading(false);
      return;
    }
    // check for image number
    if (images.length > 6) {
      toast.warning("More than 6 images is not allowed");
      setLoading(false);
      return;
    }
    // create listing
    const geolocation = {};
    let location = "";
    try {
      // create geolocation and address
      if (geolocationEnabled) {
        // google geocoding api integration
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=YOUR_API_KEY`
        );

        const data = await response.data;
        // console.log(data);
        geolocation.lat = data.results[0]?.geomatry.location.lat ?? 0;
        geolocation.lng = data.results[0]?.geomatry.location.lng ?? 0;
        location =
          data.status === "ZERO_RESULTS"
            ? undefined
            : data.results[0]?.formatted_address;
        if (!location || location.includes("undefined")) {
          toast.error("location not found");
          return;
        }
      } else {
        // manually set lat & lon for geolocation
        geolocation.lat = latitude;
        geolocation.lng = longitude;
        location = address;
      }
      // create Promise (function) to upload images to firebase storage and get download Url
      const storeImage = async (image) => {
        return new Promise((resolve, reject) => {
          const storage = getStorage();
          const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;
          const storageRef = ref(storage, "images/" + fileName);
          const uploadTask = uploadBytesResumable(storageRef, image);
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`Upload done: ${progress}%`);
              switch (snapshot.state) {
                case "paused":
                  console.log("upload paused");
                  break;
                case "running":
                  console.log("upload running");
                  break;
                default:
                  break;
              }
            },
            (error) => {
              reject(error);
            },
            () => {
              getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                console.log("file available to download at", downloadURL);
                resolve(downloadURL);
              });
            }
          );
        });
      };
      // execute and resolve promise
      const imgUrls = await Promise.all(
        [...images].map((image) => storeImage(image))
      ).catch((error) => {
        toast.error(error.message);
        return;
      });
      // console.log(imgUrls);
      //store data into firestore databse
      const formDataCopy = {
        ...formData,
        imgUrls,
        geolocation,
        timestamp: serverTimestamp(),
      };
      delete formDataCopy.images;
      delete formDataCopy.address;
      location && (formDataCopy.location = location);
      !formDataCopy.offer && delete formDataCopy.discountedPrice;
      const docRef = await addDoc(collection(db, "listings"), formDataCopy);
      setLoading(false);
      toast.success("Listing created successfully");
      navigate(`/category/${formDataCopy.type}/${docRef.id}`);
    } catch (error) {
      toast.error("could not add listing, internal server error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }
  return (
    <div className="profile">
      <header>
        <p className="pageHeader">Create a Listing</p>
      </header>

      <main>
        <form onSubmit={handleSubmit}>
          {/* listing type */}
          <label className="formLabel">Sell or Rent</label>
          <div className="formButtons">
            <button
              type="button"
              className={type === "sale" ? "formButtonActive" : "formButton"}
              id="type"
              value="sale"
              onClick={handleMutate}
            >
              Sell
            </button>
            <button
              type="button"
              className={type === "rent" ? "formButtonActive" : "formButton"}
              id="type"
              value="rent"
              onClick={handleMutate}
            >
              Rent
            </button>
          </div>
          {/* listing Name */}
          <label className="formLabel">Name</label>
          <input
            type="text"
            className="formInputName"
            id="name"
            value={name}
            onChange={handleMutate}
            maxLength="32"
            minLength="10"
            required
          />

          {/* bedrooms & bathrooms */}
          <div className="formRooms flex">
            {/* bedrooms */}
            <div>
              <label className="formLabel" htmlFor="bedrooms">
                Bedrooms
              </label>
              <input
                type="number"
                className="formInputSmall"
                id="bedrooms"
                value={bedrooms}
                onChange={handleMutate}
                min="1"
                max="10"
                required
              />
            </div>
            {/* bathrooms */}
            <div>
              <label className="formLabel" htmlFor="bathrooms">
                Bathrooms
              </label>
              <input
                type="number"
                className="formInputSmall"
                id="bathrooms"
                value={bathrooms}
                onChange={handleMutate}
                min="1"
                max="10"
                required
              />
            </div>
          </div>
          {/* parking */}
          <label className="formLabel">Parking Spot</label>
          <div className="formButtons">
            <button
              type="button"
              className={parking ? "formButtonActive" : "formButton"}
              id="parking"
              value={true}
              onClick={handleMutate}
              min="1"
              max="5"
            >
              Yes
            </button>
            <button
              type="button"
              className={
                !parking && parking !== null ? "formButtonActive" : "formButton"
              }
              id="parking"
              value={false}
              onClick={handleMutate}
            >
              No
            </button>
          </div>
          {/* furnished */}
          <label className="formLabel">Furnished</label>
          <div className="formButtons">
            <button
              type="button"
              className={furnished ? "formButtonActive" : "formButton"}
              id="furnished"
              value={true}
              onClick={handleMutate}
            >
              Yes
            </button>
            <button
              type="button"
              className={
                !furnished && furnished !== null
                  ? "formButtonActive"
                  : "formButton"
              }
              id="furnished"
              value={false}
              onClick={handleMutate}
            >
              No
            </button>
          </div>
          {/* address */}
          <label className="formLabel">Address</label>
          <textarea
            className="formInputAddress"
            id="address"
            value={address}
            onChange={handleMutate}
            required
          />
          {/* manual geolocation, latitude and longitude */}
          {!geolocationEnabled && (
            <div className="formLatLng flex">
              <div>
                <label className="formLabel">Latitude</label>
                <input
                  className="formInputSmall"
                  type="number"
                  id="latitude"
                  value={latitude}
                  onChange={handleMutate}
                  required
                />
              </div>
              <div>
                <label className="formLabel">Longitude</label>
                <input
                  className="formInputSmall"
                  type="number"
                  id="longitude"
                  value={longitude}
                  onChange={handleMutate}
                  required
                />
              </div>
            </div>
          )}
          {/* Offer */}
          <label className="formLabel">Offer</label>
          <div className="formButtons">
            <button
              className={offer ? "formButtonActive" : "formButton"}
              type="button"
              id="offer"
              value={true}
              onClick={handleMutate}
            >
              Yes
            </button>
            <button
              className={
                !offer && offer !== null ? "formButtonActive" : "formButton"
              }
              type="button"
              id="offer"
              value={false}
              onClick={handleMutate}
            >
              No
            </button>
          </div>
          {/* regular price */}
          <label className="formLabel">Regular Price</label>
          <div className="formPriceDiv">
            <input
              className="formInputSmall"
              type="number"
              id="regularPrice"
              value={regularPrice}
              onChange={handleMutate}
              min="50"
              max="750000000"
              required
            />
            {type === "rent" && <p className="formPriceText">$ / Month</p>}
          </div>
          {/* discounted price */}
          {offer && (
            <>
              <label className="formLabel">Discounted Price</label>
              <input
                className="formInputSmall"
                type="number"
                id="discountedPrice"
                value={discountedPrice}
                onChange={handleMutate}
                min="50"
                max="750000000"
                required={offer}
              />
            </>
          )}
          {/* images */}
          <label className="formLabel">Images</label>
          <p className="imagesInfo">
            The first image will be the cover (max 6).
          </p>
          <input
            className="formInputFile"
            type="file"
            id="images"
            onChange={handleMutate}
            max="6"
            accept=".jpg,.png,.jpeg"
            multiple
            required
          />
          {/* form submit button */}
          <button type="submit" className="primaryButton createListingButton">
            Create Listing
          </button>
        </form>
      </main>
    </div>
  );
};

export default CreateListing;
