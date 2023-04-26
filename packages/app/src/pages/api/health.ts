import { type NextApiRequest, type NextApiResponse } from "next";

type Data = {
  message: string;
};

export default function handler(_req: NextApiRequest, res: NextApiResponse<Data>) {
  res.status(200).json({ message: "OK" });
}
