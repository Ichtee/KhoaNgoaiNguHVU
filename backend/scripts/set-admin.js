// Creates the admin account, or changes its password. Run it where the database can be reached:
//   cd backend && npm run set-admin
// It reads MONGO_URI from backend/.env like the server does. Whoever can run this can reach the database anyway;
// the website itself has no way to create or change the account.
// Non-interactive (scripts, tests): set SET_ADMIN_USER and SET_ADMIN_PASSWORD in the environment for this one command.
require('dotenv').config();
const readline = require('readline');
const mongoose = require('mongoose');
const { connect, newCredential, Admin, Session } = require('../db');

const MIN_LENGTH = 12;

// One input stream for all the questions. Opening a new readline per question loses lines when input is piped.
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
const lines = rl[Symbol.asyncIterator]();
let hiding = false;
rl._writeToOutput = (text) => rl.output.write(hiding ? '*'.repeat(text.replace(/[\r\n]/g, '').length) : text); // * instead of what is typed

async function ask(question, hidden) {
  process.stdout.write(question);
  hiding = Boolean(hidden);
  const { value, done } = await lines.next();
  hiding = false;
  if (hidden) process.stdout.write('\n');
  if (done) throw new Error('Không nhận được dữ liệu nhập.');
  return value;
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Thiếu MONGO_URI trong backend/.env');

  let username = process.env.SET_ADMIN_USER;
  let password = process.env.SET_ADMIN_PASSWORD;
  if (username === undefined || password === undefined) {
    username = await ask('Tên đăng nhập quản trị: ');
    password = await ask(`Mật khẩu mới (từ ${MIN_LENGTH} ký tự): `, true);
    if (password !== (await ask('Nhập lại mật khẩu: ', true))) throw new Error('Hai lần nhập mật khẩu không giống nhau.');
  }
  username = username.trim().toLowerCase();
  if (!username) throw new Error('Tên đăng nhập không được để trống.');
  if (password.length < MIN_LENGTH) throw new Error(`Mật khẩu cần có ít nhất ${MIN_LENGTH} ký tự.`);

  await connect(uri);
  const existed = await Admin.exists({ username });
  await Admin.updateOne({ username }, await newCredential(password), { upsert: true });
  // the site has ONE shared admin account: any other account (an old name, a typo) is removed so it cannot linger
  const removed = await Admin.deleteMany({ username: { $ne: username } });
  // everyone who was signed in under the old password is signed out
  const { deletedCount } = await Session.deleteMany({});
  console.log(`${existed ? 'Đã đổi mật khẩu của' : 'Đã tạo tài khoản'} "${username}". Đã đăng xuất ${deletedCount} phiên đang mở.`);
  if (removed.deletedCount) console.log(`Đã xóa ${removed.deletedCount} tài khoản quản trị cũ khác: web chỉ có một tài khoản quản trị.`);
}

main()
  .catch((err) => { console.error(`Lỗi: ${err.message}`); process.exitCode = 1; })
  .finally(() => { rl.close(); return mongoose.disconnect(); });
