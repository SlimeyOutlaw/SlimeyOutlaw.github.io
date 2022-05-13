import { C } from "./Constants";
import { Manage } from "./Manage";
import { Admin } from "./Admin";
import { Driver } from "./Driver";

interface IMessageProps {
  uid: string;
  toUserUID: string;
  toUserUIDS: string[];
  fromUserUID: string;
  replyToRef: string;
  timestamp: string;
  title: string;
  content: string;
  state: C.MESSAGE_STATE_DELIVERED | C.MESSAGE_STATE_READ;
}

export class Message extends Manage {
  toUserUID: IMessageProps["toUserUID"];
  fromUserUID: IMessageProps["fromUserUID"];
  replyToRef: IMessageProps["replyToRef"];
  timestamp: IMessageProps["timestamp"];
  title: IMessageProps["title"];
  content: IMessageProps["content"];
  state: IMessageProps["state"];

  constructor({
    toUserUID,
    toUserUIDS,
    fromUserUID,
    replyToRef,
    timestamp,
    title,
    content,
    uid,
  }: Partial<IMessageProps> = {}) {
    super(uid);
    this.mem = toUserUIDS || [toUserUID];
    this.toUserUID = toUserUID;
    this.fromUserUID = fromUserUID;
    this.replyToRef = replyToRef;
    this.title = title;
    this.content = content;
    this.timestamp = timestamp;
    this.ORM = C.ORM_MESSAGES;
    this.state = C.MESSAGE_STATE_DELIVERED;
  }

  modify({ state }: Partial<IMessageProps> = {}) {
    this.state = state || this.state;
    return this.put<Message>({ uid: this.uid });
  }

  send() {
    let result = [];
    for (let i = 0; i < this.mem.length; i++) {
      result.push(
        new Message({
          toUserUID: this.mem[i],
          fromUserUID: this.fromUserUID,
          title: this.title,
          content: this.content,
          replyToRef: this.replyToRef,
          timestamp: this.timestamp || new Date(Date.now()).toISOString(),
        }).post<Message>()
      );
    }
    return Promise.all(result);
  }

  toString() {
    return new Promise<string[]>((resolve) => {
      Promise.all([
        new Admin()
          .get<Admin>({ uid: this.fromUserUID })
          .then((driver) => driver)
          .catch(() => null),
        new Driver()
          .get<Driver>({ uid: this.fromUserUID })
          .then((driver) => driver)
          .catch(() => null),
      ])
        .then(([fromAdmin, fromDriver]) => {
          const from = fromAdmin || fromDriver;
          resolve([
            `From: ${from.name.toUpperCase()}`,
            `Date: ${this._formatDate(new Date(this.timestamp))}`,
            `Title: ${this.title}`,
            this.content,
          ]);
        })
        .catch(() => resolve([, , "Error!!", " message could not be parsed"]));
    });
  }

  _formatDate(date) {
    const padTo2Digits = (num) => num.toString().padStart(2, "0");
    return (
      [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
      ].join("-") +
      " " +
      [
        padTo2Digits(date.getHours()),
        padTo2Digits(date.getMinutes()),
        // padTo2Digits(date.getSeconds()),
      ].join(":")
    );
  }
}
