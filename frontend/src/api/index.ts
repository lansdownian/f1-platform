import axios from "axios";

const BASE = "http://localhost:8000/api/f1data";

export const f1api = {
  getSeasons: () => axios.get(`${BASE}/seasons`),
  getEvents: (year: number) => axios.get(`${BASE}/events/${year}`),
  getSessions: (eventId: number) => axios.get(`${BASE}/sessions/${eventId}`),
  getTrackMap: (sessionId: number) => axios.get(`${BASE}/trackmap/${sessionId}`),
  getDrivers: (sessionId: number) => axios.get(`${BASE}/drivers/${sessionId}`),
  getFrames: (sessionId: number, fromMs: number, toMs: number) =>
    axios.get(`${BASE}/frames/${sessionId}?from_ms=${fromMs}&to_ms=${toMs}`),
  getSessionDuration: (sessionId: number) =>
    axios.get(`${BASE}/session-duration/${sessionId}`),
  ingest: (year: number, round: number, type: string) =>
    axios.post(`${BASE}/ingest?year=${year}&round=${round}&type=${type}`),
};