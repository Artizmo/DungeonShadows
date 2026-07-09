import { encode, decode } from "@msgpack/msgpack";
import { PacketCategory } from "~/shared/core/types.js";

export class Serialize {
  static serializeAction(data: any): Uint8Array {
    return encode({ category: PacketCategory.ACTION, ...data });
  }

  static serializeSnapshot(data: any): Uint8Array {
    return encode({ category: PacketCategory.SNAPSHOT, ...data });
  }

  static decode(bytes: Uint8Array): any {
    return decode(bytes);
  }
}
