import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import { useSelector } from "react-redux";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import moment from "moment/min/moment-with-locales";
import Warehouse from "./pages/Warehouse";
import Transactions from "./pages/Transactions";
import Clients from "./pages/Clients";
import OrdersPage from "./pages/Orders";
import Sms from "./pages/Sms";

moment.defineLocale("uz-latin", {
  months: [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentabr",
    "Oktabr",
    "Noyabr",
    "Dekabr",
  ],
  monthsShort: [
    "yan",
    "fev",
    "mar",
    "apr",
    "may",
    "iyn",
    "iyl",
    "avg",
    "sen",
    "okt",
    "noy",
    "dek",
  ],
  weekdays: [
    "Yakshanba",
    "Dushanba",
    "Seshanba",
    "Chorshanba",
    "Payshanba",
    "Juma",
    "Shanba",
  ],
  weekdaysShort: ["yak", "dush", "sesh", "chor", "pay", "jum", "shan"],
  weekdaysMin: ["ya", "du", "se", "ch", "pa", "ju", "sh"],
  longDateFormat: {
    LT: "HH:mm",
    LTS: "HH:mm:ss",
    L: "DD/MM/YYYY",
    LL: "D-MMMM YYYY",
    LLL: "D-MMMM YYYY HH:mm",
    LLLL: "dddd, D-MMMM YYYY HH:mm",
  },
  calendar: {
    sameDay: "[Bugun soat] LT",
    nextDay: "[Ertaga soat] LT",
    nextWeek: "dddd [kuni soat] LT",
    lastDay: "[Kecha soat] LT",
    lastWeek: "[O‘tgan] dddd [kuni soat] LT",
    sameElse: "L",
  },
  relativeTime: {
    future: "Yaqin %s ichida",
    past: "%s oldin",
    s: "bir necha soniya",
    ss: "%d soniya",
    m: "bir daqiqa",
    mm: "%d daqiqa",
    h: "bir soat",
    hh: "%d soat",
    d: "bir kun",
    dd: "%d kun",
    M: "bir oy",
    MM: "%d oy",
    y: "bir yil",
    yy: "%d yil",
  },
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 7, // The week that contains Jan 7th is the first week of the year.
  },
});

moment.locale("uz-latin");

const App = () => {
  const { user } = useSelector(({ user }) => user);
  const [loading, setLoading] = React.useState(false);

  return user ? (
    <div className="app">
      <Sidebar />
      <div className="route">
        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              position: "fixed",
              width: "100%",
              left: 0,
              zIndex: 100000000,
              padding: 20,
            }}
          >
            loading...
          </div>
        )}
        <Routes>
          <Route
            path="/"
            element={<Dashboard {...{ loading, setLoading }} />}
          />
          <Route
            path="/orders"
            element={<OrdersPage {...{ loading, setLoading }} />}
          />
          <Route
            path="/warehouse"
            element={<Warehouse {...{ loading, setLoading }} />}
          />
          <Route
            path="/transactions"
            element={<Transactions {...{ loading, setLoading }} />}
          />
          <Route
            path="/clients"
            element={<Clients {...{ loading, setLoading }} />}
          />
          <Route
            path="/messages"
            element={<Sms {...{ loading, setLoading }} />}
          />
          <Route path="*" element={<Navigate to={'/'} />} />
        </Routes>
      </div>
    </div>
  ) : (
    <Login />
  );
};

export default App;
