const snakeToCamel = (dataObj) => {
  for (let key of Object.keys(dataObj)) {
    const camelKey = key.replace(/_([a-z])/g, (match, p1) => p1.toUpperCase());
    if (camelKey !== key) {
      dataObj[camelKey] = dataObj[key];
      delete dataObj[key];
    }
  }
  return dataObj;
};

const snakeToCamelData = (data) => {
  if (Array.isArray(data)) {
    return data.map(snakeToCamel);
  } else {
    return snakeToCamel(data);
  }
};

const camelToSnakeData = (data) => {
  console.log(data);
  if (typeof data !== "object" || data === null) {
    return data;
  }

  return Object.keys(data).reduce((acc, key) => {
    const newKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    acc[newKey] = data[key];
    return acc;
  }, {});
};

module.exports = { snakeToCamelData, camelToSnakeData };
