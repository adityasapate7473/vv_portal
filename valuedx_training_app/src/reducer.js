// batchReducer.js

import { FETCH_BATCH_NAMES_REQUEST, FETCH_BATCH_NAMES_SUCCESS, FETCH_BATCH_NAMES_FAILURE } from './batchaction';

const initialState = {
  batchNames: [],
  loading: false,
  error: null,
};

const batchReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_BATCH_NAMES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_BATCH_NAMES_SUCCESS:
      return {
        ...state,
        batchNames: action.payload,
        loading: false,
        error: null,
      };
    case FETCH_BATCH_NAMES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default batchReducer;
