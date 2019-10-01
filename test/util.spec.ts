"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
import { SwingletreeUtil } from "../src/util";

chai.use(require("sinon-chai"));

const sandbox = sinon.createSandbox();

describe("ConfigurationService", () => {

	describe("Utilities", () => {
		it("should flatten objects", () => {
			const testObj = {
				a: {
					b: "c",
					d: {
						e: "f",
						g: "h",
						array: [ 1, 2, 3 ]
					}
				}
			};

			const result = SwingletreeUtil.flattenObject(testObj);

			expect(result["a.d.e"]).to.be.equal("f");
			expect(result["a.d.g"]).to.be.equal("h");
			expect(result["a.b"]).to.be.equal("c");
			expect(result["a.d.array.0"]).to.be.equal(1);
			expect(result["a.d.array.1"]).to.be.equal(2);
			expect(result["a.d.array.2"]).to.be.equal(3);
		});

		it("should flatten objects and concat arrays", () => {
			const testObj = {
				a: {
					b: "c",
					d: {
						e: "f",
						g: "h",
						array: [ 1, 2, 3 ]
					}
				}
			};

			const result = SwingletreeUtil.flattenObject(testObj, true);

			expect(result["a.d.e"]).to.be.equal("f");
			expect(result["a.d.g"]).to.be.equal("h");
			expect(result["a.b"]).to.be.equal("c");
			expect(result["a.d.array"]).to.be.lengthOf(3);
		});
	});
});