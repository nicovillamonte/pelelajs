export class Twitter {
  tweet = '';

  get restantes() {
    return 140 - this.tweet.length;
  }

  get espacioRestanteClass() {
    return (this.restantes > 10) ? 'ok' : this.restantes > 5 ? 'limite' : 'pasado';
  }
}