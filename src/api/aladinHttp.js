const axios = require("axios");

const ALADIN_LIST_BASE_URL = process.env.ALADIN_BOOK_LIST_BASE_URL;
const ALADIN_ITEM_BASE_URL = process.env.ALADIN_BOOK_ITEM_BASE_URL;
const ALADIN_SEARCH_BOOKS_BASE_URL = process.env.ALADIN_SEARCH_BOOKS_BASE_URL;
const ALADIN_KEY = process.env.ALADIN_KEY;

const createAxiosInstance = (baseURL) => {
  return axios.create({
    baseURL: baseURL,
    params: {
      ttbkey: ALADIN_KEY,
    },
    withCredentials: true,
  });
};

const aladinBookListAxios = createAxiosInstance(ALADIN_LIST_BASE_URL);
const aladinBookItemAxios = createAxiosInstance(ALADIN_ITEM_BASE_URL);
const aladinSearchBooksAxios = createAxiosInstance(ALADIN_SEARCH_BOOKS_BASE_URL);

module.exports = {
  aladinBookListAxios,
  aladinBookItemAxios,
  aladinSearchBooksAxios,
};
