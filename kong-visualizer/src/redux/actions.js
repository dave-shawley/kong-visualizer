import { fetchData } from "../components/KongClient";

export const configureKong = (kongAdminURL) => ({
  type: "CONFIGURE_KONG",
  payload: { kongAdminURL },
});

export const connectToKong = (kongAdminURL) => ({
  type: "CONNECT_TO_KONG",
  payload: { kongAdminURL },
});

export const kongDataReceived = (routes, services) => ({
  type: "KONG_DATA_RECEIVED",
  routes: routes,
  services: services,
});

export const kongFetchFailed = (error) => ({
  type: "KONG_FAILURE",
  payload: { error },
});

export const searchRoutes = (search) => ({
  type: "RUN_ROUTE_SEARCH",
  method: search.method,
  vhost: search.vhost,
  path: search.path,
});

export function fetchKongInfo(kongAdminURL) {
  return async function (dispatch) {
    dispatch(connectToKong(kongAdminURL));
    try {
      const routes = await fetchData("/routes"),
        services = await fetchData("/services");
      dispatch(kongDataReceived(routes, services));
    } catch (error) {
      console.log(`${error.name}: ${error.message}`);
      dispatch(kongFetchFailed(error));
    }
  };
}
