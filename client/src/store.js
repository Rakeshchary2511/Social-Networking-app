import { createStore, applyMiddleware } from "redux";
import { composeWithDevTools } from "reat-devtools-extension";
import thunk from "redux-thunk";
import rootReducer from "./reducers";

const middleware = [thunk];

const initialState = {};

const store = createStore(
  rootReducer,
  initialState,
  applyMiddleware(...middleware)
);

export default store;
