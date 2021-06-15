import { isMobile } from "../../support/utils";
import { User, Transaction } from "../../../src/models";

type NotificationsCtx = {
  userA: User;
  userB: User;
  userC: User;
};

describe("Notifications", function () {
  const ctx = {} as NotificationsCtx;

  beforeEach(function () {
    cy.task("db:seed");

    cy.intercept("GET", "/notifications*").as("getNotifications");
    cy.intercept("POST", "/transactions").as("createTransaction");
    cy.intercept("PATCH", "/notifications/*").as("updateNotification");
    cy.intercept("POST", "/comments/*").as("postComment");

    cy.database("filter", "users").then((users: User[]) => {
      ctx.userA = users[0];
      ctx.userB = users[1];
      ctx.userC = users[2];
    });
  });

  describe("notifications from user interactions 1", function () {
    it("User A likes a transaction of User B; User B gets notification that User A liked transaction ", function () {
      cy.loginByXstate(ctx.userA.username);
      cy.wait("@getNotifications");

      cy.database("find", "transactions", { senderId: ctx.userB.id }).then(
        (transaction: Transaction) => {
          cy.visit(`/transaction/${transaction.id}`);
        }
      );

      cy.log("🚩 Renders the notifications badge with count");
      cy.wait("@getNotifications")
        .its("response.body.results.length")
        .then((notificationCount) => {
          cy.getBySel("nav-top-notifications-count").should("have.text", `${notificationCount}`);
        });
      cy.visualSnapshot("Renders the notifications badge with count");

      const likesCountSelector = "[data-test*=transaction-like-count]";
      cy.contains(likesCountSelector, 0);
      cy.getBySelLike("like-button").click();
      // a successful "like" should disable the button and increment
      // the number of likes
      cy.getBySelLike("like-button").should("be.disabled");
      cy.contains(likesCountSelector, 1);
      cy.visualSnapshot("Like Count Incremented");

      cy.switchUser(ctx.userB.username);
      cy.visualSnapshot(`Switch to User ${ctx.userB.username}`);

      cy.wait("@getNotifications")
        .its("response.body.results.length")
        .as("preDismissedNotificationCount");

      cy.visit("/notifications");

      cy.wait("@getNotifications");

      cy.getBySelLike("notification-list-item")
        .should("have.length", 9)
        .first()
        .should("contain", ctx.userA?.firstName)
        .and("contain", "liked");

      cy.log("🚩 Marks notification as read");
      cy.getBySelLike("notification-mark-read").first().click({ force: true });
      cy.wait("@updateNotification");

      cy.get("@preDismissedNotificationCount").then((count) => {
        cy.getBySelLike("notification-list-item").should("have.length.lessThan", Number(count));
      });
      cy.visualSnapshot("Notification count after notification dismissed");
    });
  });

  describe("notifications from user interactions 2", function () {
    before(() => {
      cy.task("wait");
    });

    it("User A likes a transaction of User B; User B gets notification that User A liked transaction ", function () {
      cy.loginByXstate(ctx.userA.username);
      cy.wait("@getNotifications");

      cy.database("find", "transactions", { senderId: ctx.userB.id }).then(
        (transaction: Transaction) => {
          cy.visit(`/transaction/${transaction.id}`);
        }
      );

      cy.log("🚩 Renders the notifications badge with count");
      cy.wait("@getNotifications")
        .its("response.body.results.length")
        .then((notificationCount) => {
          cy.getBySel("nav-top-notifications-count").should("have.text", `${notificationCount}`);
        });
      cy.visualSnapshot("Renders the notifications badge with count");

      const likesCountSelector = "[data-test*=transaction-like-count]";
      cy.contains(likesCountSelector, 0);
      cy.getBySelLike("like-button").click();
      // a successful "like" should disable the button and increment
      // the number of likes
      cy.getBySelLike("like-button").should("be.disabled");
      cy.contains(likesCountSelector, 1);
      cy.visualSnapshot("Like Count Incremented");

      cy.switchUser(ctx.userB.username);
      cy.visualSnapshot(`Switch to User ${ctx.userB.username}`);

      cy.wait("@getNotifications")
        .its("response.body.results.length")
        .as("preDismissedNotificationCount");

      cy.visit("/notifications");

      cy.wait("@getNotifications");

      cy.getBySelLike("notification-list-item")
        .should("have.length", 9)
        .first()
        .should("contain", ctx.userA?.firstName)
        .and("contain", "liked");

      cy.log("🚩 Marks notification as read");
      cy.getBySelLike("notification-mark-read").first().click({ force: true });
      cy.wait("@updateNotification");

      cy.get("@preDismissedNotificationCount").then((count) => {
        cy.getBySelLike("notification-list-item").should("have.length.lessThan", Number(count));
      });
      cy.visualSnapshot("Notification count after notification dismissed");
    });
  });
});
