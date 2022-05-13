let thisAdmin,
  thisDriver,
  thisLot,
  thisSpot,
  thisPayment,
  thisRequest,
  thisMessage,
  thisNotificationTimer;

// -- navigation and history handler --
$(window).on("hashchange", function (_event) {
  const { hash, pathname } = new URL(location.href);
  if (hash.match(/-register-/)) {
    renderSection(hash.replace(/#/, ""));
    return;
  }
  if (hash && (thisAdmin || thisDriver)) {
    $(".navigate-btn-admin-home").removeClass("hidden");
    $(".navigate-btn-driver-home").removeClass("hidden");
    renderSection(hash.replace(/#/, ""));
    renderUpcomingRequestBanner();
  } else {
    $(".navigate-btn-admin-home").addClass("hidden");
    $(".navigate-btn-driver-home").addClass("hidden");
    location.href = pathname;
  }
});
$(window).on("load", function () {
  const { hash, pathname } = new URL(location.href);
  if (hash) {
    location.href = pathname;
  }
});

/////////////////////////////////////////////////////
//                injection                       //
////////////////////////////////////////////////////
// -- html injections --
$("#register-form-request-lot-uid").click(function () {
  if ($("#register-form-request-lot-uid").children().length === 1) {
    PMS.getLots().then((list) => {
      $.each(list, function (_i, lot) {
        $("#register-form-request-lot-uid").append(
          $("<option>", {
            value: lot.uid,
            text: lot.name,
          })
        );
      });
    });
  }
});
$("#register-form-request-payment-uid").click(function () {
  if ($("#register-form-request-payment-uid").children().length === 1) {
    PMS.getThisPayments().then((list) => {
      $.each(list, function (_i, payment) {
        $("#register-form-request-payment-uid").append(
          $("<option>", {
            value: payment.uid,
            text: payment.name,
          })
        );
      });
    });
  }
});
$("#send-form-message-admin-to-user-uid").click(function () {
  if ($("#send-form-message-admin-to-user-uid").children().length === 1) {
    PMS.getDrivers().then((list) => {
      $.each(list, function (_i, driver) {
        $("#send-form-message-admin-to-user-uid").append(
          $("<option>", {
            value: driver.uid,
            text: driver.name,
          })
        );
      });
    });
  }
});
$("body").on("click", ".navigate-btn-create-lot-section", function () {
  location.hash = "lot-creation-section";
});
$("body").on("click", ".navigate-btn-manage-lots-section", function () {
  PMS.getLots().then((list) => {
    location.hash = "lot-selection-section";
    renderLotSelectionTo(list, "#lot-selection-section .content-injection");
  });
});
$("body").on("click", ".navigate-btn-pending-requests-section", function () {
  PMS.getRequests().then((list) => {
    const pendingRequests = list.filter(
      (request) => request.state === "pending"
    );
    location.hash = "admin-requests-section";
    renderRequestsTo(
      pendingRequests,
      "#admin-requests-section .content-injection"
    );
  });
});
$("body").on("click", ".navigate-btn-manage-drivers-section", function () {
  PMS.getDrivers().then((list) => {
    renderDriversTo(list, "#driver-management-section .content-injection");
    location.hash = "driver-management-section";
  });
});
$("body").on("click", ".navigate-btn-admin-messages-section", function () {
  PMS.getMessages().then((list) => {
    const messages = list.filter((msg) => msg.toUserUID === thisAdmin.uid);
    renderMessagesTo(messages, "#admin-messages-section .content-injection");
    location.hash = "admin-messages-section";
  });
});
$("body").on("click", ".navigate-btn-lot-id", function () {
  const $target = $(this);
  PMS.getLots().then((list) => {
    location.hash = "lot-selected-section";
    $.each(list, function (_i, lot) {
      if ($target.attr("id") === lot.uid) {
        thisLot = lot;
        renderLot(thisLot);
      }
    });
  });
});
$("body").on("click", ".grid-elem-spot-id", function () {
  const $target = $(this);
  thisSpot = thisLot.spots.filter((s) => s.uid === $target.attr("id"))[0];
  renderLot(thisLot);
});
$("body").on("click", "#action-btn-spot-reserve", function () {
  thisLot.reserveSpot({ uid: thisSpot.uid }).then((_lot) => {
    renderLot(thisLot);
  });
});
$("body").on("click", "#action-btn-spot-open", function () {
  thisLot.openSpot({ uid: thisSpot.uid }).then((_lot) => {
    renderLot(thisLot);
  });
});
$("body").on("click", "#action-btn-request-automate", function () {
  $("#action-form-admin-requests-selection")
    .attr("data-action", "automate")
    .submit();
});
$("body").on("click", "#action-btn-request-accept", function () {
  $("#action-form-admin-requests-selection")
    .attr("data-action", "accept")
    .submit();
});
$("body").on("click", "#action-btn-request-reject", function () {
  $("#action-form-admin-requests-selection")
    .attr("data-action", "reject")
    .submit();
});
$("body").on("click", ".action-btn-driver-ban-toggle", function () {
  const $target = $(this);
  PMS.getDrivers().then((list) => {
    const [selectedDriver] = list.filter(
      (driver) => driver.uid === $target.attr("data-driver-uid")
    );
    selectedDriver.toggleBan().then(() => {
      renderDriversTo(list, "#driver-management-section .content-injection");
    });
  });
});
$("body").on("click", "#action-btn-admin-new-message", function () {
  $("#admin-new-message-tab").removeClass("hidden");
  $("#admin-inbox-messages-tab").addClass("hidden");
  // preload select options
  $("#send-form-message-admin-to-user-uid").click();
});
$("body").on("click", "#action-btn-admin-inbox-messages", function () {
  PMS.getMessages().then((list) => {
    const messages = list.filter((msg) => msg.toUserUID === thisAdmin.uid);
    renderMessagesTo(messages, "#admin-messages-section .content-injection");
    $("#admin-inbox-messages-tab").removeClass("hidden");
    $("#admin-new-message-tab").addClass("hidden");
  });
});
$("body").on(
  "click",
  ".navigate-btn-driver-manage-requests-section, #action-btn-driver-request-history",
  function () {
    PMS.getRequests().then((list) => {
      location.hash = "driver-request-management-section";
      const payments = thisDriver.payments.map((p) => p.uid);
      const requests = list.filter(
        (req) => payments.indexOf(req.paymentUID) > -1
      );
      renderDriverRequestHistoryTo(
        requests,
        "#driver-request-history-tab .content-injection"
      );
      $("#driver-request-registration-tab").addClass("hidden");
      $("#driver-request-history-tab").removeClass("hidden");
    });
  }
);
$("body").on("click", "#action-btn-driver-request-registration", function () {
  PMS.getPayments().then((list) => {
    const [hasPayment] = list.filter((p) => p.driverUID === thisDriver.uid);
    if (!hasPayment) {
      $("#driver-request-registration-tab .content-injection").empty();
      $("#driver-request-registration-tab .content-injection").append(
        $("<span>", {
          class: "register-request-absent-payment",
          text: "Please add a payment first!",
        })
      );
      $(
        "#driver-request-registration-tab input, #driver-request-registration-tab select"
      ).each(function (_idx, elem) {
        elem.disabled = true;
      });
    } else {
      $(
        "#driver-request-registration-tab input[type='submit']"
      )[0].disabled = true;
      $(
        "#driver-request-registration-tab input, #driver-request-registration-tab select"
      ).each(function (_idx, elem) {
        $(elem).on("change", function (e) {
          const lotUID = $("#register-form-request-lot-uid").val();
          const paymentUID = $("#register-form-request-payment-uid").val();
          const start = $("#register-form-request-start").val();
          const end = $("#register-form-request-end").val();
          if (lotUID && paymentUID && start && end) {
            const cost =
              new PMS.Request({
                lotUID,
                paymentUID,
                start,
                end,
              }).cost() / 100;
            const costStr = (cost > 10 ? 10 : cost < 0 ? 1 : cost).toFixed(2);
            $(".register-request-price-text").text(`£${costStr}`);
            $(
              "#driver-request-registration-tab input[type='submit']"
            )[0].disabled = false;
          }
        });
      });
      // preload select options
      $("#register-form-request-lot-uid").click();
      $("#register-form-request-payment-uid").click();
    }
    $("#driver-request-registration-tab").removeClass("hidden");
    $("#driver-request-history-tab").addClass("hidden");
  });
});
$("body").on("click", ".navigate-btn-driver-messages-section", function () {
  PMS.getMessages().then((list) => {
    const messages = list.filter((msg) => msg.toUserUID === thisDriver.uid);
    renderMessagesTo(messages, "#driver-messages-section .content-injection");
    location.hash = "driver-messages-section";
  });
});
$("body").on("click", "#action-btn-driver-new-message", function () {
  $("#driver-new-message-tab").removeClass("hidden");
  $("#driver-inbox-messages-tab").addClass("hidden");
  // preload select options
  $("#send-form-message-driver-to-user-uid").click();
});
$("body").on("click", "#action-btn-driver-inbox-messages", function () {
  PMS.getMessages().then((list) => {
    const messages = list.filter((msg) => msg.toUserUID === thisDriver.uid);
    renderMessagesTo(messages, "#driver-messages-section .content-injection");
    $("#driver-inbox-messages-tab").removeClass("hidden");
    $("#driver-new-message-tab").addClass("hidden");
  });
});
$("body").on("click", ".navigate-btn-manage-payment-section", function () {
  PMS.getPayments().then((list) => {
    const payment = list.filter(
      (payment) => payment.driverUID === thisDriver.uid
    );
    renderPaymentsTo(
      payment,
      "#driver-payment-management-section .content-injection"
    );
    location.hash = "driver-payment-management-section";
  });
});

/////////////////////////////////////////////////////
//                    forms                       //
////////////////////////////////////////////////////

// -- admin registration --
$("#register-form-admin").submit(function (event) {
  event.preventDefault();
  const name = $("#register-form-admin-name").val();
  const password = $("#register-form-admin-password").val();
  new PMS.Admin({ name, password })
    .register()
    .then((admin) => {
      thisAdmin = admin;
      location.hash = "admin-home-section";
      console.log(thisAdmin);
    })
    .catch((error) => {
      notify(error);
    });
});

// -- admin login --
$("#login-form-admin").submit(function (event) {
  event.preventDefault();
  const name = $("#login-form-admin-name").val();
  const password = $("#login-form-admin-password").val();
  new PMS.Admin({ name, password })
    .login()
    .then((admin) => {
      thisAdmin = admin;
      location.hash = "admin-home-section";
      console.log(thisAdmin);
    })
    .catch((error) => {
      notify(error);
    });
});

// -- driver registration --
$("#register-form-driver").submit(function (event) {
  event.preventDefault();
  const name = $("#register-form-driver-name").val();
  const email = $("#register-form-driver-email").val();
  const password = $("#register-form-driver-password").val();
  new PMS.Driver({ name, email, password })
    .register()
    .then((driver) => {
      PMS.getDrivers().then((list) => {
        [thisDriver] = list.filter((d) => d.uid === driver.uid);
        location.hash = "driver-home-section";
        console.log(thisDriver);
      });
    })
    .catch((error) => {
      notify(error);
    });
});

// -- driver login --
$("#login-form-driver").submit(function (event) {
  event.preventDefault();
  const email = $("#login-form-driver-email").val();
  const password = $("#login-form-driver-password").val();
  new PMS.Driver({ email, password })
    .login()
    .then((driver) => {
      if (driver.state === "banned") {
        throw new Error("Access Forbidden ");
      }
      return driver;
    })
    .then((driver) => {
      PMS.getDrivers().then((list) => {
        [thisDriver] = list.filter((d) => d.uid === driver.uid);
        location.hash = "driver-home-section";
        console.log(thisDriver);
      });
    })
    .catch((error) => {
      notify(error);
    });
});

// -- lot registration --
$("#register-form-lot").submit(function (event) {
  event.preventDefault();
  const name = $("#register-form-lot-name").val();
  const coordinate = $("#register-form-lot-coordinate").val();
  const capacity = $("#register-form-lot-capacity").val();
  new PMS.Lot({ name, coordinate, capacity })
    .register()
    .then((lot) => {
      thisLot = lot;
      PMS.getLots().then((list) => {
        renderLotSelectionTo(list, "#lot-selection-section .content-injection");
        location.hash = "lot-selection-section";
      });
      console.log(thisLot);
    })
    .catch((error) => {
      notify(error);
    });
});

// -- request registration --
$("#register-form-request").submit(function (event) {
  event.preventDefault();
  const lotUID = $("#register-form-request-lot-uid").val();
  const paymentUID = $("#register-form-request-payment-uid").val();
  const start = $("#register-form-request-start").val();
  const end = $("#register-form-request-end").val();
  new PMS.Request({
    lotUID,
    paymentUID,
    start,
    end,
  })
    .send()
    .then((request) => {
      thisRequest = request;
      $("#action-btn-driver-request-history").click();
      console.log(thisRequest);
    });
});

// -- payment registration --
$("#register-form-payment").submit(function (event) {
  event.preventDefault();
  const name = $("#register-form-payment-name").val();
  const ccn = $("#register-form-payment-card-no").val();
  const ccv = $("#register-form-payment-ccv").val();
  const exp = $("#register-form-payment-expiry-date").val();
  new PMS.Payment({
    driverUID: thisDriver.uid,
    name,
    ccn,
    ccv,
    exp,
  })
    .register()
    .then((payment) => {
      thisPayment = payment;
      location.hash = "driver-home-section";
      notify("-- card added ---");
      console.log(thisPayment);
    });
});

// -- admin message sending --
$("#send-form-message-admin").submit(function (event) {
  event.preventDefault();
  const toUserUIDS = $("#send-form-message-admin-to-user-uid").val();
  const title = $("#send-form-message-admin-title").val();
  const content = $("#send-form-message-admin-content").val();
  new PMS.Message({
    fromUserUID: thisAdmin.uid,
    toUserUIDS,
    title,
    content,
  })
    .send()
    .then((message) => {
      thisMessage = message;
      notify("-- message sent --");
      console.log(thisMessage);
    })
    .catch((error) => {
      notify(error);
    });
});

// -- driver message sending --
$("#send-form-message-driver").submit(function (event) {
  event.preventDefault();
  const title = $("#send-form-message-driver-title").val();
  const content = $("#send-form-message-driver-content").val();
  PMS.getAdmins().then((list) => {
    const adminUIDS = list.map((l) => l.uid);
    new PMS.Message({
      fromUserUID: thisDriver.uid,
      toUserUIDS: adminUIDS,
      title,
      content,
    })
      .send()
      .then((message) => {
        thisMessage = message;
        notify("-- message sent --");
        console.log(thisMessage);
      })
      .catch((error) => {
        notify(error);
      });
  });
});

// -- request automate action --
$("#action-form-admin-requests-selection").submit(function (event) {
  event.preventDefault();
  const $target = $(this);
  let filteredRequests = [];
  let promiseRequestActions = [];
  PMS.getRequests().then((list) => {
    $("#action-form-admin-requests-selection input[type='checkbox']").each(
      function (_i, item) {
        for (const req of list) {
          if (req.uid === $(item).val() && $(item).is(":checked")) {
            filteredRequests.push(req);
          }
        }
      }
    );
    for (const req of filteredRequests) {
      req[$target.attr("data-action")];
      promiseRequestActions.push(req[$target.attr("data-action")]());
    }
    Promise.all(promiseRequestActions).then(() => {
      const pendingRequests = list.filter((r) => r.state === "pending");
      renderRequestsTo(
        pendingRequests,
        "#admin-requests-section .content-injection"
      );
    });
  });
});

/////////////////////////////////////////////////////
//                utilities                       //
////////////////////////////////////////////////////

// -- make a section visible --
function renderSection(sectionID) {
  $(".page-section").each(function (_idx, elem) {
    if (elem.id === sectionID) {
      elem.classList.remove("hidden");
    } else {
      elem.classList.add("hidden");
    }
  });
  hydrateSection();
}

// -- update the visual presentation of request list to a section of the DOM --
function renderRequestsTo(requests, host) {
  $(host).empty();
  $.each(requests, function (_i, request) {
    thisRequest = request;
    request.toString().then((labelString) => {
      $(host).append(
        $("<div>").append(
          $("<input>", {
            id: request.uid,
            value: request.uid,
            name: "selections[]",
            type: "checkbox",
          }),
          [
            $("<label>", {
              for: request.uid,
              text: labelString,
            }),
            $("<hr>"),
          ]
        )
      );
    });
  });
  hydrateSection();
}

// -- update the visual presentation of a lot selection buttons --
function renderLotSelectionTo(lots, host) {
  $(host).empty();
  $.each(lots, function (_i, lot) {
    $(host).append(
      $("<button>", {
        id: lot.uid,
        name: lot.name,
        text: lot.name,
        class: "navigate-btn-lot-id",
      })
    );
  });
  hydrateSection();
}

// -- update the visual presentation of driver management section --
function renderDriversTo(drivers, host) {
  $(host).empty();
  $.each(drivers, function (_i, driver) {
    $(host).append(
      $("<ul>").append(
        $("<li>", {
          id: driver.uid,
          "data-state": driver.state,
        }).append([
          $("<span>", { text: driver.name }),
          $("<span>", { text: driver.email }),
          $("<button>", {
            text:
              driver.state === "active"
                ? "Ban"
                : driver.state === "banned"
                ? "Unban"
                : "n/a",
            class: "action-btn-driver-ban-toggle",
            "data-driver-uid": driver.uid,
          }),
        ]),
        [$("<hr>")]
      )
    );
  });
  hydrateSection();
}

// -- update the visual presentation of a lot --
function renderLot(lot) {
  // lot render
  $("#lot-selected-section .content-injection").empty();
  $.each(lot.spots, function (i, spot) {
    $("#lot-selected-section .content-injection").append(
      $("<button>", {
        text: `S-${i + 1}`,
        id: spot.uid,
        "data-type": spot.type,
        "data-state": spot.state,
        class: "grid-elem-spot-id",
      })
    );
  });
  // spot render
  let isThisSpotInThisLot = false;
  const $target = $($(".grid-elem-spot-id").first());
  thisSpot =
    thisSpot || thisLot.spots.filter((s) => s.uid === $target.attr("id"))[0];
  $(".grid-elem-spot-id").each(function (_idx, elem) {
    if (thisSpot.uid === $(elem).attr("id")) {
      isThisSpotInThisLot = true;
      $(elem).attr("data-selected", "true");
    } else {
      $(elem).attr("data-selected", "false");
    }
  });
  if (!isThisSpotInThisLot) {
    thisSpot = thisLot.spots.filter((s) => s.uid === $target.attr("id"))[0];
    $target.attr("data-selected", "true");
  }
  hydrateSection();
}

// -- update the visual presentation of messages --
function renderMessagesTo(messages, host) {
  $(host).empty();
  $.each(messages, function (_i, msg) {
    thisMessage = msg;
    msg.toString().then((contentList) => {
      $(host).append(
        $("<ul>").append(
          $("<li>", {
            id: msg.uid,
            tabindex: 0,
            "data-state": msg.state,
          }).append([
            $("<span>", { text: contentList[0] }),
            $("<span>", { text: contentList[1] }),
            $("</br>"),
            $("<span>", { text: contentList[2] }),
            $("<span>", { text: contentList[3] }),
          ]),
          [$("<hr>")]
        )
      );
    });
  });
  hydrateSection();
}

// -- update the visual presentation of driver requests --
function renderDriverRequestHistoryTo(requests, host) {
  $(host).empty();
  $.each(requests, function (_i, req) {
    thisRequest = req;
    req.toString().then((content) => {
      $(host).append(
        $("<ul>").append(
          $("<li>", {
            id: req.uid,
            text: content.match(/-(.*)/)[1],
            "data-state": req.state,
          }),
          [$("<hr>")]
        )
      );
    });
  });
  hydrateSection();
}

// -- update the visual presentation of driver payments --
function renderPaymentsTo(payments, host) {
  $(host).empty();
  $.each(payments, function (_i, p) {
    thisPayment = p;
    $(host).append(
      $("<div>", {
        id: p.uid,
        "data-state": p.state,
        class: "payment-item-wrapper bank-card",
      }).append([
        $("<span>", {
          class: "payment-item-text",
          text: "Debit",
        }),
        $("<span>", {
          class: "payment-item-text",
          text: new Date(p.exp).toISOString().split("T")[0],
        }),
      ])
    );
  });
  hydrateSection();
}

function renderUpcomingRequestBanner() {
  if (thisDriver) {
    const banner = $("<span>", {
      class: "upcoming-request-banner-injection",
      text: "*** Loading requests... ***",
    });
    $("#upcoming-request-banner-wrapper .content-injection").empty();
    $("#upcoming-request-banner-wrapper .content-injection").addClass(
      "pulsate"
    );
    $("#upcoming-request-banner-wrapper .content-injection").append(banner);

    [thisRequest] = thisDriver.requests.filter((r) => r.state === "inuse");
    if (thisRequest) {
      $(".navigate-btn-check-in").addClass("hidden");
      $(".navigate-btn-check-out").removeClass("hidden");
      $(".navigate-btn-check-out").prop("disabled", true);
      PMS.getLots().then((lot) => {
        const [_lot] = lot.filter((l) => l.uid === thisRequest.lotUID);
        banner.text(`Currently parked at ${_lot.name}`);
        $("#upcoming-request-banner-wrapper .content-injection").removeClass(
          "pulsate"
        );
        $(".navigate-btn-check-out").prop("disabled", false);
        $(".navigate-btn-check-out").on("click", function (e) {
          e.stopImmediatePropagation();
          thisRequest.checkOut().then((_spot) => {
            // rerender self
            renderUpcomingRequestBanner();
          });
        });
      });
    } else {
      $(".navigate-btn-check-out").addClass("hidden");
      $(".navigate-btn-check-in").removeClass("hidden");
      $(".navigate-btn-check-in").prop("disabled", true);
      const requests = thisDriver.requests.filter(
        (r) => r.state === "accepted"
      );
      const startTimeList = requests.map((r) => new Date(r.start).getTime());
      const idx = startTimeList.indexOf(Math.min(...startTimeList));
      if (idx > -1) {
        thisRequest = requests[idx];
        thisRequest.toString().then((res) => {
          $("#upcoming-request-banner-wrapper .content-injection").removeClass(
            "pulsate"
          );
          banner.text(res.match(/-(.*)/)[1]);
          $(".navigate-btn-check-in").prop("disabled", false);
          $(".navigate-btn-check-in").on("click", function (e) {
            e.stopImmediatePropagation();
            thisRequest.checkIn().then((_spot) => {
              PMS.getLots().then((lot) => {
                const [_lot] = lot.filter((l) => l.uid === thisRequest.lotUID);
                notify(`-- Welcome to ${_lot.name} --`);
                //rerender self
                renderUpcomingRequestBanner();
              });
            });
          });
        });
      } else {
        banner.text("*** No upcoming requests ***");
        $("#upcoming-request-banner-wrapper .content-injection").removeClass(
          "pulsate"
        );
        $(".upcoming-request-banner-injection").addClass(
          "upcoming-request-banner-injection-disabled"
        );
      }
    }

    hydrateSection();
  }
}
// --hydrate page-section --
function hydrateSection() {
  if (thisAdmin) {
    $("[data-inner-admin-name]").text(`👋🏿 ${thisAdmin.name}`);
  }
  if (thisDriver) {
    $("[data-inner-driver-name]").text(`👋🏿 ${thisDriver.name}`);
  }
  if (thisLot) {
    $("[data-inner-lot-uid]").text(thisLot.uid);
    $("[data-inner-lot-coordinate]").text(thisLot.coordinate);
    $("[data-inner-lot-name]").text(thisLot.name);
    $("[data-inner-lot-spaces]").text(thisLot.spots.length);
    $("[data-inner-spot-opened]").text(
      thisLot.spots.filter((s) => s.state === "opened").length
    );
    $("[data-inner-spot-occupied]").text(
      thisLot.spots.filter((s) => s.state === "occupied").length
    );
    $("[data-inner-spot-reserved]").text(
      thisLot.spots.filter((s) => s.state === "reserved").length
    );
  }
  if (thisSpot) {
    $("[data-inner-spot-uid]").text(thisSpot.uid);
    $("[data-inner-spot-state]").text(thisSpot.state);
    switch (thisSpot.state) {
      case "reserved":
        $("#action-btn-spot-reserve").attr("disabled", true);
        $("#action-btn-spot-open").attr("disabled", false);
        break;
      case "opened":
        $("#action-btn-spot-reserve").attr("disabled", false);
        $("#action-btn-spot-open").attr("disabled", true);
        break;
      default:
        $("#action-btn-spot-reserve").attr("disabled", true);
        $("#action-btn-spot-open").attr("disabled", true);
        break;
    }
  }
}

// --on screen prompt handler--
function notify(text) {
  clearTimeout(thisNotificationTimer);
  $("#notification").empty();
  $("#notification").append($("<span>", { text }));
  $("#notification").addClass("notification-enter");
  thisNotificationTimer = setTimeout(() => {
    $("#notification").removeClass("notification-enter");
  }, 6000);
}
