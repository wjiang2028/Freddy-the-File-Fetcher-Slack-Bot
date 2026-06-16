require("dotenv").config();
const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

const FILE_TYPES = {
  excel: ["xlsx", "xls", "xlsm", "csv"],
  word: ["docx", "doc"],
  ppt: ["pptx", "ppt"],
  powerpoint: ["pptx", "ppt"],
  pdf: ["pdf"],
  image: ["png", "jpg", "jpeg", "gif", "bmp", "tiff", "webp", "heic", "svg"],
  images: ["png", "jpg", "jpeg", "gif", "bmp", "tiff", "webp", "heic", "svg"]
};

const HELP_HINT = "\n\nFor help, type /freddy-help";

const HELP_TEXT = [
  "*How to use Freddy*",
  "",
  "*Command format:*",
  "`/freddy location file-type (from @person/#channelname) (to destination)`",
  "_Parts in parentheses are optional._",
  "",
  "*Locations:*",
  "• `#channelname` — a specific channel",
  "• `all` — everywhere Freddy can see",
  "• `here` — the channel/group you're typing in",
  "",
  "*File types:*",
  "• `pdf` — pdf",
  "• `word` — docx, doc",
  "• `excel` — xlsx, xls, xlsm, csv",
  "• `ppt` (or `powerpoint`) — pptx, ppt",
  "• `image` — png, jpg, jpeg, gif, bmp, tiff, webp, heic, svg",
  "• `all` — every type",
  "",
  "*from… (narrows what's retrieved):*",
  "• `@person` — only files that person uploaded",
  "• `#channelname` — only files that are from specified channel are retreived (Freddy must be invited to that channel)",
  "• `here` — only files from the channel/group you are typing in gets retreived",
  "",
  "*to… (where the results are sent):*",
  "• `#channelname` — sends the files to that channel",
  "• `here` — sends them to the channel/group you're in",
  "",
  "_*Make sure that Freddy is invited to the channel/group so he can send messages there (/invite @Freddy)_",
  "",
  "*Examples:*",
  "• `/freddy #general pdf` — all PDFs in #general, privately",
  "• `/freddy #general all from @Boss` — all of Boss's files from #general, privately",
  "• `/freddy all image to here` — every image Freddy can see, sent to group/channel you are typing in",
  "• `/freddy #general excel to #HR` — spreadsheets from #general sent to #HR",
  "• `/freddy #general word from @Boss to #HR` — Word docs that Boss sent in #general sent to #HR",
  "• `/freddy all all to here` — every file Freddy can see, sent to group/channel you are typing in"
].join("\n");

app.command("/freddy-help", async ({ ack, respond }) => {
  await ack();
  await respond(HELP_TEXT);
});

app.command("/freddy", async ({ command, ack, respond, client }) => {
  await ack();

  const idFrom = (m) => m.replace(/^<[#@]/, "").replace(/\|.*$/, "").replace(/>$/, "");

  const resolveChannel = async (arg) => {
    if (arg.startsWith("<#")) return idFrom(arg);
    const name = arg.replace(/^#/, "").toLowerCase();
    const list = await client.conversations.list({
      types: "public_channel,private_channel",
      limit: 1000
    });
    const found = list.channels.find(c => c.name === name);
    return found ? found.id : null;
  };

  const tokens = command.text.trim().split(/\s+/).filter(Boolean);
  let channelArg = null;
  let typeArg = null;
  let senderArg = null;
  const toUserArgs = [];
  let toChannelArg = null;
  let toHere = false;
  let toRequested = false;
  const allTokens = [];

  let mode = null;
  for (const t of tokens) {
    const lower = t.toLowerCase();
    if (lower === "from") { mode = "from"; continue; }
    if (lower === "to")   { mode = "to"; toRequested = true; continue; }

    const isUser = t.startsWith("<@");
    const isChannel = t.startsWith("<#") || t.startsWith("#");

    if (mode === "to" && isUser) { toUserArgs.push(t); continue; }
    if (mode === "to" && isChannel) { toChannelArg = t; mode = null; continue; }
    if (mode === "to" && (lower === "here" || lower === "this")) { toHere = true; mode = null; continue; }

    mode = null;
    if (FILE_TYPES[lower]) { typeArg = lower; continue; }
    if (lower === "all") { allTokens.push(t); continue; }
    if (lower === "here" || lower === "this") { channelArg = "here"; continue; }
    if (isUser) { senderArg = t; continue; }
    if (isChannel) { channelArg = t; continue; }
  }
  for (const _ of allTokens) {
    if (!channelArg) channelArg = "all";
    else if (!typeArg) typeArg = "all";
  }

  if (!channelArg) {
    await respond("You need to tell me a channel to search. Example: /freddy #general pdf" + HELP_HINT);
    return;
  }
  if (!typeArg) {
    await respond(
      "Please tell me which file type. Options:\n" +
      "• excel, word, ppt, pdf, image — that specific type\n" +
      "• all — every file type\n\n" +
      "Example: /freddy #general image" + HELP_HINT
    );
    return;
  }
  if (toRequested && toUserArgs.length === 0 && !toChannelArg && !toHere) {
    await respond("To send the results, type @ or # and pick the person or channel from the popup so it turns blue." + HELP_HINT);
    return;
  }

  try {
    const listArgs = { count: 200 };

    if (channelArg.toLowerCase() === "here") {
      listArgs.channel = command.channel_id;
    } else if (channelArg.toLowerCase() !== "all") {
      const id = await resolveChannel(channelArg);
      if (!id) {
        await respond(`I couldn't find the channel "${channelArg}". Type it with a # and pick it from the popup so it turns blue.` + HELP_HINT);
        return;
      }
      listArgs.channel = id;
    }

    const result = await client.files.list(listArgs);

    const senderId = senderArg ? idFrom(senderArg) : null;

    let fromWho = "";
    if (senderId) {
      try {
        const info = await client.users.info({ user: senderId });
        const name =
          info.user.profile.real_name ||
          info.user.profile.display_name ||
          info.user.real_name ||
          info.user.name;
        fromWho = ` from ${name}`;
      } catch (e) {
        fromWho = "";
      }
    }

    const extensions = FILE_TYPES[typeArg];
    let matches = (typeArg === "all")
      ? result.files
      : result.files.filter(f => extensions.includes((f.filetype || "").toLowerCase()));
    if (senderId) matches = matches.filter(f => f.user === senderId);

    const typeLabel = typeArg === "all" ? "" : `${typeArg} `;

    if (matches.length === 0) {
      const present = [...new Set(result.files.map(f => f.filetype).filter(Boolean))];
      const hint = present.length
        ? ` The files I can see are: ${present.join(", ")}.`
        : ` I don't see any files here.`;
      await respond(`No ${typeLabel}files${fromWho} found.${hint}`);
      return;
    }

    const lines = matches.map(f => `• <${f.permalink}|${f.name}>`).join("\n");
    const message = `Found ${matches.length} ${typeLabel}file(s)${fromWho}:\n${lines}`;

    if (toHere) {
      await client.chat.postMessage({ channel: command.channel_id, text: message });
      await respond(`Posted ${matches.length} file(s) here.`);
    } else if (toChannelArg) {
      const destId = await resolveChannel(toChannelArg);
      if (!destId) {
        await respond(`I couldn't find the destination channel "${toChannelArg}".` + HELP_HINT);
        return;
      }
      await client.chat.postMessage({ channel: destId, text: message });
      await respond(`Sent ${matches.length} file(s) to ${toChannelArg}.`);
    } else if (toUserArgs.length > 0) {
      const recipientIds = toUserArgs.map(idFrom);
      const dm = await client.conversations.open({
        users: [command.user_id, ...recipientIds].join(",")
      });
      await client.chat.postMessage({ channel: dm.channel.id, text: message });
      await respond(`Sent ${matches.length} file(s) to a group chat with ${toUserArgs.join(", ")}.`);
    } else {
      await respond(message);
    }
  } catch (error) {
    console.error(error);
    await respond(`Something went wrong: ${error.message}` + HELP_HINT);
  }
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();