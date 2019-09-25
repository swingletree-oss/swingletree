export class SwingletreeUtil {
	public static flattenObject(obj: any, preserveArrays = false) {
		const segment: any = {};

		for (const i in obj) {
			if (!obj.hasOwnProperty(i)) continue;

			if (preserveArrays && Array.isArray(obj[i])) {
				segment[i] = obj[i];
				continue;
			}

			if (obj[i] instanceof Object && obj[i] !== null) {
				const flatObject = this.flattenObject(obj[i], preserveArrays);
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