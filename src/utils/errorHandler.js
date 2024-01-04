const { StatusCodes } = require("http-status-codes");

const serverError = (res, err) => {
  console.error(res, err);
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: "서버 오류가 발생했습니다. 잠시 후에 다시 시도해주세요.",
  });
};

const sqlError = (res, err) => {
  console.error(err);
  return res
    .status(StatusCodes.BAD_REQUEST)
    .json({
      message: "잘못된 정보를 입력하였습니다. 확인 후 다시 입력해주세요.",
    })
    .end();
};

module.exports = {
  serverError,
  sqlError,
};
