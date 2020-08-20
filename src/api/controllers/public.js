const sharp = require("sharp");
const { get } = require("axios");

const allowedPrefixes = [
  "https://cdn.discordapp.com/icons/",
  "https://robo-hamster.ru/img/",
  "http://localhost:8080/img/",
];

exports.blurImage = async (req, res) => {
  const sourceURL = req.query.s || null;
  // if (!sourceURL || allowedPrefixes.some((prefix) => sourceURL.startsWith(prefix))) {
  //   return res
  //     .code(400)
  //     .send({ message: "Ошибка при валидации изображения", status: 400, details: { sourceURL } });
  // }

  const sourceBinary = await _getBinary(sourceURL);
  const bluredImg = await sharp(sourceBinary).resize(1080, 1080).blur(20).png().toBuffer();
  res.type("image/png").send(bluredImg);
};

async function _getBinary(url) {
  return get(url, {
    responseType: "arraybuffer",
  }).then((response) => Buffer.from(response.data, "binary"));
}
