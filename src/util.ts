export class SwingletreeUtil {
	public static flattenObject(obj: any) {
		const segment: any = {};

		for (const i in obj) {
			if (!obj.hasOwnProperty(i)) continue;

			if (obj[i] instanceof Object && obj[i] !== null) {
				const flatObject = this.flattenObject(obj[i]);
				for (const x in flatObject) {
					if (!flatObject.hasOwnProperty(x)) continue;
					segment[i + "." + x] = flatObject[x];
				}
			} else {
					segment[i] = obj[i];
			}
		}
		return segment;
	}
}