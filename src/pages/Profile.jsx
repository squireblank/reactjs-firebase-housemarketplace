import { getAuth, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.config";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Profile = () => {
  const auth = getAuth();
  const [changeDetails, setChangeDetails] = useState(false);
  const [formData, setFormData] = useState({
    name: auth.currentUser.displayName,
    email: auth.currentUser.email,
  });
  const { name, email } = formData;
  const navigate = useNavigate();

  // handle log out
  const handleClick = () => {
    auth.signOut();
    console.log("logged out");
    navigate("/signin");
  };

  // handle form data change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // handle form data update
  const handleUpdate = async () => {
    try {
      if (auth.currentUser.displayName !== name) {
        // update name in firebase auth
        await updateProfile(auth.currentUser, {
          displayName: name,
        });
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, { name });
        toast.success("profile updated");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setChangeDetails(!changeDetails);
    }
  };
  return (
    <div className="profile">
      <header className="profileHeader">
        <p className="pageHeader">My Profile</p>
        <button className="logOut" type="button" onClick={handleClick}>
          Logout
        </button>
      </header>
      <main>
        <div className="profileDetailsHeader">
          <p className="profileDetailsText">Personal Info</p>
          <p className="changePersonalDetails" onClick={handleUpdate}>
            {changeDetails ? "done" : "change"}
          </p>
        </div>
        <div className="profileCard">
          <form onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="name">Name: </label>
            <input
              type="text"
              name="name"
              id="name"
              value={name}
              onChange={handleChange}
              className={changeDetails ? "profileNameActive" : "profileName"}
              disabled={!changeDetails}
            />
            <label htmlFor="email">Email: </label>
            <input
              type="email"
              name="email"
              id="email"
              value={email}
              // onChange={handleChange}
              // className={changeDetails ? "profileEmailActive" : "profileEmail"}
              className="profileEmail"
              disabled={true}
            />
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
