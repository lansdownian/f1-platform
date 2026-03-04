import axios from "axios";

const BASE = "http://localhost:8000/api/f1data";

export const f1api = {
  getSeasons: () => axios.get(`${BASE}/seasons`),
  getEvents: (year) => axios.get(`${BASE}/events/${year}`),
  getSessions: (eventId) => axios.get(`${BASE}/sessions/${eventId}`),
  getTrackMap: (sessionId) => axios.get(`${BASE}/trackmap/${sessionId}`),
  getDrivers: (sessionId) => axios.get(`${BASE}/drivers/${sessionId}`),
  getFrames: (sessionId, fromMs, toMs) =>
    axios.get(`${BASE}/frames/${sessionId}?from_ms=${fromMs}&to_ms=${toMs}`),
  getSessionDuration: (sessionId) =>
    axios.get(`${BASE}/session-duration/${sessionId}`),
  ingest: (year, round, type) =>
    axios.post(`${BASE}/ingest?year=${year}&round=${round}&type=${type}`),
};
