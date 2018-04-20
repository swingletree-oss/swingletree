import * as fs from "fs";
import * as jwt from "jsonwebtoken";

export class GithubTokenFactory {
	private appId: number;
	private static key: string;

	constructor(appId: number, keyFile: string) {
		this.appId = appId;
		GithubTokenFactory.key = GithubTokenFactory.key || fs.readFileSync(keyFile).toString();
	}

	public createJWT(): string {
		const payload = {
			iss: this.appId
		};

		const token = jwt.sign(payload, GithubTokenFactory.key, { expiresIn: "1m", algorithm: "RS256"});
		return token;
	}
}