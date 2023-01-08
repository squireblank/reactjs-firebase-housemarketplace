import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Explore from "./pages/Explore";
import Offers from "./pages/Offers";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgetPassword from "./pages/ForgetPassword";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Explore />} />
          <Route path="offers" element={<Offers />} />
          <Route path="profile" element={<PrivateRoute />}>
            <Route index element={<Profile />} />
          </Route>
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="forgotpassword" element={<ForgetPassword />} />
        </Route>
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
