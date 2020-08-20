import { v4 as uuidv4 } from "uuid";
import reducer from "./kong";

describe("kong reducer", () => {
  it("should be empty by default", () => {
    const state = reducer(undefined, { type: "IGNORED" });
    expect(state.kongAdminURL).toEqual(new URL("htttp://127.0.0.1:38001"));
    expect(state.kongEntities).toEqual({});
    expect(state.routes.lastUpdate).toBeUndefined();
    expect(state.routes.items).toEqual([]);
    expect(state.services.lastUpdate).toBeUndefined();
    expect(state.services.items).toEqual([]);
  });
  it("should set admin URL when configured", () => {
    const state = reducer(undefined, {
      type: "CONFIGURE_KONG",
      payload: { kongAdminURL: new URL("http://example.com/kong") },
    });
    expect(state.kongAdminURL).toEqual(new URL("http://example.com/kong"));
  });
  it("should clear routes and services when connecting to Kong", () => {
    const startDate = new Date();
    let state = reducer(undefined, { type: "IGNORED" });
    state.routes.lastUpdate = new Date(startDate.getTime() - 43200 * 1000);
    state.routes.items.push("route");
    state.routes.lastUpdate = new Date(startDate.getTime() - 86400 * 1000);
    state.services.items.push("service");

    state = reducer(state, { type: "CONNECT_TO_KONG" });
    expect(state.routes.items).toEqual([]);
    expect(state.routes.lastUpdate.getTime()).toBeGreaterThanOrEqual(
      startDate.getTime()
    );
    expect(state.services.items).toEqual([]);
    expect(state.services.lastUpdate.getTime()).toBeGreaterThanOrEqual(
      startDate.getTime()
    );
  });
  it("should save route entities", () => {
    const routeData = [
      { id: uuidv4(), strip_path: false },
      { id: uuidv4(), strip_path: false },
    ];
    let state = reducer(undefined, { type: "CONNECT_TO_KONG" });
    state = reducer(state, {
      type: "KONG_DATA_RECEIVED",
      routes: routeData,
      services: [],
    });
    expect(Object.keys(state.kongEntities).length).toEqual(routeData.length);
    for (let route of routeData) {
      expect(state.kongEntities).toHaveProperty(route.id);
      expect(state.routes.items).toContainEqual(route.id);
      expect(state.kongEntities[route.id].type).toEqual("route");
    }
  });
  it("should save service entities", () => {
    const serviceData = [
      { id: uuidv4(), retries: 0 },
      { id: uuidv4(), retries: 0 },
    ];
    let state = reducer(undefined, { type: "CONNECT_TO_KONG" });
    state = reducer(state, {
      type: "KONG_DATA_RECEIVED",
      routes: [],
      services: serviceData,
    });
    expect(Object.keys(state.kongEntities).length).toEqual(serviceData.length);
    for (let service of serviceData) {
      expect(state.kongEntities).toHaveProperty(service.id);
      expect(state.services.items).toContainEqual(service.id);
      expect(state.kongEntities[service.id].type).toEqual("service");
    }
  });
});
