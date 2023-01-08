import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import googleIcon from "../assets/svg/googleIcon.svg";

const OAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // check for user
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      // if user doesn't exist, create user
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          name: user.displayName,
          email: user.email,
          timestamp: serverTimestamp(),
        });
      }
      toast.success("Success with Google Authentication");
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="socialLogin">
      <p>Sign {location.pathname === "/signup" ? "up" : "in"} with</p>
      <button className="socialIconDiv">
        <img
          className="socialIconImg"
          src={googleIcon}
          alt="google"
          onClick={handleClick}
        />
      </button>
    </div>
  );
};

export default OAuth;
