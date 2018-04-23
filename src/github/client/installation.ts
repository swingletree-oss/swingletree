export class Installation {
	public id: number;
	public app_id: number;
	public installationId: number;

	public account: Account;
}

class Account {
	public login: string;
	public type: string;
}