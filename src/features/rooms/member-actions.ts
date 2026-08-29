import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";

/** A member picks (or is given) their singer colour. Own document only, per the rules. */
export async function setMemberColor(code: string, uid: string, color: string): Promise<void> {
  await updateDoc(doc(firestore(), "rooms", code, "members", uid), { color });
}
