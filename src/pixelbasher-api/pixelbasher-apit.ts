const URL_BASE = import.meta.env.VITE_URL;
const URL_USERS = URL_BASE + "user";
const URL_LAYOUTS = URL_BASE + "layout";
const URL_SCORES = URL_BASE + "score";

export type BlockLayout = {
  id: number;
  data: Uint8Array;
};

export type Score = {
  name: string;
  score: number;
};

export type User = {
  userName: string;
  token: string;
};

type ResponseFail = {
  success: false;
  message: string;
};

type ResponseSuccess<T> = {
  success: true;
  data: T;
};
export type Response<T> = ResponseSuccess<T> | ResponseFail;

export const loginUserAPI = async (
  userName: string,
  password: string
): Promise<Response<User>> => {
  const response = await fetch(URL_BASE + "auth/login", {
    method: "POST",
    body: JSON.stringify({ userName: userName, password: password }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    if (response.status >= 400 && response.status <= 500) {
      return { success: false, message: "Invalid user or password" };
    } else {
      return { success: false, message: "Could not log in" };
    }
  }
  const user = (await response.json()) as User;

  return {
    success: true,
    data: user,
  };
};

export const createUserAPI = async (
  userName: string,
  password: string
): Promise<Response<User>> => {
  const response = await fetch(URL_USERS, {
    method: "POST",
    body: JSON.stringify({ userName: userName, password: password }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const error = await response.json();
    if (error && error.message) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Could not create user" };
  }
  const addedUser = (await response.json()) as User;
  return {
    success: true,
    data: addedUser,
  };
};

export const getLayoutsAPI = async (
  token: string
): Promise<Response<BlockLayout[]>> => {
  const response = await fetch(URL_LAYOUTS, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return { success: false, message: "Could not get layouts" };
  }

  const layouts = (await response.json()) as {
    id: number;
    layout: { data: Uint8Array };
  }[];

  return {
    success: true,
    data: layouts.map((layout) => ({
      id: layout.id,
      data: layout.layout.data,
    })),
  };
};

export const getScoresAPI = async (
  levelId: number,
  token: string
): Promise<Response<Score[]>> => {
  const response = await fetch(URL_SCORES + "/get", {
    method: "POST",
    body: JSON.stringify({ levelId: levelId }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return { success: false, message: "Could not get scores" };
  }

  const scores = (await response.json()) as Score[];
  return {
    success: true,
    data: scores,
  };
};

export const addScoreAPI = async (
  levelId: number,
  score: number,
  token: string
): Promise<Response<Score>> => {
  const response = await fetch(URL_SCORES + "/add", {
    method: "POST",
    body: JSON.stringify({ levelId: levelId, score: score }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return { success: false, message: "Could not add score" };
  }

  const addedScore = (await response.json()) as Score;
  return {
    success: true,
    data: addedScore,
  };
};
