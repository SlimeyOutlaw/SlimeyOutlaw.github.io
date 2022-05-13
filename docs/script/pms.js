import {
  Admin,
  Driver,
  Lot,
  Request,
  Payment,
  Message,
  Collection,
  P,
  // } from "../../dist/index.modern.js";
} from "../script/index.modern.js";

P.BEFORE_FETCH = function () {
  const spinner = document.getElementById("busy-spinner");
  spinner.classList.remove("hidden");
};
P.AFTER_FETCH = function () {
  const spinner = document.getElementById("busy-spinner");
  spinner.classList.add("hidden");
};

window.PMS = {
  Admin,
  Driver,
  Lot,
  Request,
  Payment,
  Message,
  Collection,

  getAdmins: () =>
    new Collection("ADMINS").then((res) => {
      console.log("\n\n- get all admins\n", res);
      return res;
    }),

  getDrivers: () =>
    new Promise((resolve, reject) => {
      new Collection("DRIVERS").then((drivers) =>
        new Collection("REQUESTS").then((requests) =>
          new Collection("PAYMENTS").then((payments) => {
            const res = drivers.map((driver) => {
              driver.payments = payments.filter(
                (p) => p.driverUID === driver.uid
              );
              const paymentUIDS = driver.payments.map((p) => p.uid);
              driver.requests = requests.filter(
                (r) => paymentUIDS.indexOf(r.paymentUID) > -1
              );
              return driver;
            });
            console.log("\n\n- get all drivers\n", res);
            resolve(res);
          })
        )
      );
    }),

  getLots: () =>
    new Collection("LOTS").then((res) => {
      console.log("\n\n- get all lots\n", res);
      return res;
    }),

  getPayments: () =>
    new Collection("PAYMENTS").then((res) => {
      console.log("\n\n- get all payments\n", res);
      return res;
    }),

  getRequests: () =>
    new Collection("REQUESTS").then((res) => {
      console.log("\n\n- get all requests\n", res);
      return res;
    }),

  getMessages: () =>
    new Collection("MESSAGES").then((res) => {
      console.log("\n\n- get all messages\n", res);
      return res;
    }),

  getThisPayments: () =>
    new Collection("PAYMENTS").then((res) =>
      res.filter((item) => item.driverUID === thisDriver.uid)
    ),
};

console.log("------- PMS -------");
