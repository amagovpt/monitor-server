export class InvalidUrl extends Error {
  private readonly url: string;

  constructor(url: string, message?: string) {
    super(message);
    this.url = url;
  }

  public getUrl(): string {
    return this.url;
  }
}
