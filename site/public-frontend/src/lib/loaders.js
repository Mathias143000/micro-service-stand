import { defer } from "react-router-dom";
import apiRequest from "./apiRequest";

export const catalogLoader = async () => {
  const postPromise = await apiRequest("/posts");
  return defer({
    postResponse: postPromise,
  });
};

export const singlePageLoader = async ({ params }) => {
  const res = await apiRequest("/posts/" + params.id);
  return res.data;
};
export const listPageLoader = async ({ request }) => {
  const query = request.url.split("?")[1];
  const postPromise = await apiRequest(query ? `/posts?${query}` : "/posts");
  return defer({
    postResponse: postPromise,
  });
};

export const profilePageLoader = async () => {
  const postPromise = apiRequest("/users/profilePosts");
  return defer({
    postResponse: postPromise,
  });
};
