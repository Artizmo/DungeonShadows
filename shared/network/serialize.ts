import { encode, decodeMulti } from "@msgpack/msgpack";
import { PacketCategory } from "~/shared/core/types.js";

export class Serialize {
  static serializeAction(data: any): Uint8Array {
    return encode({ category: PacketCategory.ACTION, ...data });
  }

  static serializeSnapshot(data: any): Uint8Array {
    return encode({ category: PacketCategory.SNAPSHOT, ...data });
  }

  static decode(bytes: Uint8Array): any {
    // decodeMulti parses sequentially. Calling .next().value grabs
    // the first valid object and ignores the remaining padding bytes.
    return decodeMulti(bytes).next().value;
  }
}
