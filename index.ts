import { ApplicationBuilder } from "./application";
import { Component } from "./component";

class SigninComponent extends Component<HTMLFormElement> {
  username: string;
  password: string;
  password2: string;

  constructor(root: HTMLFormElement, username?: string, password?: string) {
    super(root);
    this.username = username ?? "";
    this.password2 = this.password = password ?? "";
    root.addEventListener("submit", (ev) => {
      ev.preventDefault();
      this.handleSubmit();
    });
  }

  get usernameOK(): boolean {
    return this.username.length > 4;
  }

  get usernameClass(): string {
    return this.inputClass(this.usernameOK);
  }

  get passwordsMatch(): boolean {
    return this.password == this.password2;
  }

  get password2Class(): string {
    return this.inputClass(this.passwordsMatch);
  }

  get sufficentPassword(): boolean {
    return this.password.length > 8 && this.score() > 50;
  }

  get passwordClass(): string {
    return this.inputClass(this.sufficentPassword);
  }

  get canSignup(): boolean {
    return this.usernameOK && this.passwordsMatch && this.sufficentPassword;
  }

  score() {
    let score = 0;
    if (!this.password) return score;

    // award every unique letter until 5 repetitions
    const letters = {};
    for (let i = 0; i < this.password.length; i++) {
      letters[this.password[i]] = (letters[this.password[i]] || 0) + 1;
      score += 5.0 / letters[this.password[i]];
    }

    // bonus points for mixing it up
    const variations = {
      digits: /\d/.test(this.password),
      lower: /[a-z]/.test(this.password),
      upper: /[A-Z]/.test(this.password),
      nonWords: /\W/.test(this.password),
    };

    let variationCount = 0;
    for (var check in variations) {
      variationCount += variations[check] == true ? 1 : 0;
    }
    score += (variationCount - 1) * 10;

    return score;
  }

  handleSubmit() {
    const { username, password } = this;
    alert("Data: " + JSON.stringify({ username, password }));
  }

  private inputClass(pred: boolean) {
    return `input ${pred ? "is-success" : "is-danger"}`;
  }
}

const app = new ApplicationBuilder().register("signin", SigninComponent).bind(document.body);
