import { useContext, useEffect, useState } from "react";
import "./profileUpdatePage.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { useNavigate } from "react-router-dom";
import SafeImage from "../../components/safeImage/SafeImage";
import { useLanguage } from "../../context/LanguageContext";

function ProfileUpdatePage() {
  const { currentUser, updateUser } = useContext(AuthContext);
  const [error, setError] = useState("");
  const [avatarValue, setAvatarValue] = useState(currentUser.avatar || "");
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    setAvatarValue(currentUser.avatar || "");
  }, [currentUser.avatar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const { username, email, password, phone } = Object.fromEntries(formData);

    try {
      const res = await apiRequest.put(`/users/${currentUser.id}`, {
        username,
        email,
        password,
        mobile_number: phone,
        avatar: avatarValue || null,
      });
      updateUser(res.data);
      navigate("/profile");
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || t("profileUpdate.error"));
    }
  };

  return (
    <div className="profileUpdatePage">
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <h1>{t("profileUpdate.title")}</h1>
          <div className="item">
            <label htmlFor="username">{t("profileUpdate.username")}</label>
            <input
              id="username"
              name="username"
              type="text"
              defaultValue={currentUser.username}
            />
          </div>
          <div className="item">
            <label htmlFor="email">{t("profileUpdate.email")}</label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={currentUser.email}
            />
          </div>
          <div className="item">
            <label htmlFor="password">{t("profileUpdate.password")}</label>
            <input id="password" name="password" type="password" />
          </div>
          <div className="item">
            <label htmlFor="phone">{t("profileUpdate.phone")}</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={currentUser.mobile_number}
              pattern="[0-9]{10}"
            />
          </div>
          <div className="item">
            <label htmlFor="avatarUrl">{t("profileUpdate.avatar")}</label>
            <input
              id="avatarUrl"
              name="avatarUrl"
              type="url"
              value={avatarValue}
              onChange={(event) => setAvatarValue(event.target.value)}
              placeholder={t("profileUpdate.avatarPlaceholder")}
            />
          </div>
          <button>{t("profileUpdate.submit")}</button>
          {error && <span>{error}</span>}
        </form>
      </div>
      <div className="sideContainer">
        <SafeImage
          src={avatarValue || currentUser.avatar}
          fallback="/noavatar.jpg"
          alt={currentUser.username}
          className="avatar"
        />
      </div>
    </div>
  );
}

export default ProfileUpdatePage;
