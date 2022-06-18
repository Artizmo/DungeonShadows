import { authenticate } from '/auth';

const handler = async (req, res) => {
  // pass email, password to authenticate()
  const isAuthed = await authenticate();
  console.log('isAuthed', isAuthed)
  res.status(200).json({ isAuthed });
}

export default handler;
