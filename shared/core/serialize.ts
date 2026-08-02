import { encode, decodeMulti } from "@msgpack/msgpack";
import { PacketCategory } from "~/shared/core/types.js";

export class Serialize {
  static data(data: any): Uint8Array {
    return encode({ ...data });
  }

  static action(data: any): Uint8Array {
    return encode({ category: PacketCategory.API, ...data });
  }

  static snapshot(data: any): Uint8Array {
    return encode({ category: PacketCategory.SNAPSHOT, ...data });
  }

  static decode(buffer: Uint8Array): any {
    // decodeMulti parses sequentially. Calling .next().value grabs
    // the first valid object and ignores the remaining padding bytes.
    return decodeMulti(buffer).next().value;
  }
}
