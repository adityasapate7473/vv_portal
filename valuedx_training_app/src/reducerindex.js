// reducers/index.js
import { combineReducers } from 'redux';
import batchReducer from './batchReducer';

const rootReducer = combineReducers({
  batches: batchReducer,
});

export default rootReducer;
