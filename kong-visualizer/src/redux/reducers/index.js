import { combineReducers } from "redux";
import kong from "./kong";
import kongclient from "./kongclient";
import search from "./search";

export default combineReducers({ kongclient, kong, search });
