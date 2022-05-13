import { C, P } from "./Constants";

class Mock {
  db;

  constructor() {
    // fetch(C.DB_FILE_PATH)
    //   .then((res) => res.json())
    //   .then((data) => {
    //     this.db = data;
    //   })
    //   .catch((error) => console.error(error));

    this._getFromJSONBin();
  }

  backend({ body, endpoint }) {
    let count = 0;
    P.BEFORE_FETCH();
    return new Promise((resolve, reject) => {
      const _resolve = (res) => {
        // P.AFTER_FETCH();
        // resolve(res)
        return this._putToJSONBin(endpoint).then(() => {
          P.AFTER_FETCH();
          resolve(res);
        });
      };
      const _reject = (res) => {
        P.AFTER_FETCH();
        return reject(res);
      };
      const idx = setInterval(() => {
        count++;
        if (this.db) {
          clearInterval(idx);
          let pointer = [];
          const { pathname, searchParams } = new URL(
            "http://localhost:3000" + endpoint
          );
          const dbTable = searchParams.get("table");
          for (const [key, value] of searchParams) {
            if (key != "table") {
              pointer = [key, value];
            }
          }

          switch (pathname + "?") {
            case C.API_ENDPOINT_GET_ALL:
              _resolve(this.db[dbTable]);
              break;

            case C.API_ENDPOINT_GET:
              _resolve(
                this.db[dbTable].filter(
                  (entry) => entry[pointer[0]] === pointer[1]
                )[0]
              );
              break;

            case C.API_ENDPOINT_POST:
              this.db[dbTable].push(JSON.parse(body));
              _resolve(JSON.parse(body));
              break;

            case C.API_ENDPOINT_PUT:
              let res;
              this.db[dbTable] = this.db[dbTable].map((entry) => {
                if (entry[pointer[0]] === pointer[1]) {
                  res = { ...entry, ...JSON.parse(body) };
                  return res;
                } else {
                  return entry;
                }
              });
              _resolve(res);
              break;

            case C.API_ENDPOINT_DELETE:
              this.db[dbTable] = this.db[dbTable].filter(
                (entry) => entry[pointer[0]] !== pointer[1]
              );
              _resolve("{status: SUCCESSFUL}");
              break;

            case C.API_ENDPOINT_AUTH:
              _resolve(
                this.db[dbTable].filter(
                  (entry) =>
                    entry.password === JSON.parse(body).password &&
                    (entry.name === JSON.parse(body).name ||
                      (entry.email && entry.email === JSON.parse(body).email))
                )[0]
              );
              break;

            case C.API_ENDPOINT_RECOVER_EMAIL:
              _resolve("{status: SUCCESSFUL}");
              break;

            default:
              _reject(`Unknown api endpoint ${pathname}`);
              break;
          }
        }
        if (count === 10) {
          clearInterval(idx);
          _reject(`${C.DB_FILE_PATH} connection timed out`);
        }
      }, 1000);
    });
  }

  _getFromJSONBin() {
    fetch("https://api.jsonbin.io/b/6266ff3b019db4679691967c", {
      method: "GET",
      headers: {
        versioning: false,
        "Secret-Key":
          "$2b$10$7r9JOM3pywMiCEjVDCMg0.h/QybOzC3DqhplCvwT1P.bA6tv7LWgy",
      },
    })
      .then((res) => {
        if (res.status !== 200) {
          throw Error("Something went wrong with the connection");
        }
        return res.json();
      })
      .then((data) => {
        this.db = data;
      })
      .catch((error) => console.error(error));
  }

  _putToJSONBin(_endpoint) {
    const { pathname } = new URL("http://localhost:3000" + _endpoint);
    const endpoint = pathname + "?";
    if (
      endpoint === C.API_ENDPOINT_POST ||
      endpoint === C.API_ENDPOINT_PUT ||
      endpoint === C.API_ENDPOINT_DELETE
    ) {
      return new Promise((resolve, reject) => {
        fetch("https://api.jsonbin.io/b/6266ff3b019db4679691967c", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            versioning: false,
            "Secret-Key":
              "$2b$10$7r9JOM3pywMiCEjVDCMg0.h/QybOzC3DqhplCvwT1P.bA6tv7LWgy",
          },
          body: JSON.stringify(this.db),
        })
          .then((res) => {
            if (res.status !== 200) {
              throw Error("Something went wrong with the connection");
            }
            return res.json();
          })
          .then(({ data }) => {
            this.db = data;
            resolve();
          })
          .catch((error) => reject(error));
      });
    } else {
      return Promise.resolve();
    }
  }
}

export const M = new Mock();
