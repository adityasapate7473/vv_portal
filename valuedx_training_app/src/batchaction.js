// batchActions.js

export const FETCH_BATCH_NAMES_REQUEST = 'FETCH_BATCH_NAMES_REQUEST';
export const FETCH_BATCH_NAMES_SUCCESS = 'FETCH_BATCH_NAMES_SUCCESS';
export const FETCH_BATCH_NAMES_FAILURE = 'FETCH_BATCH_NAMES_FAILURE';

export const fetchBatchNamesRequest = () => ({
  type: FETCH_BATCH_NAMES_REQUEST,
});

export const fetchBatchNamesSuccess = (batchNames) => ({
  type: FETCH_BATCH_NAMES_SUCCESS,
  payload: batchNames,
});

export const fetchBatchNamesFailure = (error) => ({
  type: FETCH_BATCH_NAMES_FAILURE,
  payload: error,
});
