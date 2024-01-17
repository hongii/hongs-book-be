const snakeToCamel = (dataObj) => {
  for (let key of Object.keys(dataObj)) {
    const camelKey = key.replace(/_([a-zA-Z])/g, (match, p1) => p1.toUpperCase());
    if (camelKey !== key) {
      dataObj[camelKey] = dataObj[key];
      delete dataObj[key];
    }
  }
  return dataObj;
};

const snakeToCamelData = (data) => {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      data[i] = snakeToCamel(data[i]);
    }
  } else {
    data = snakeToCamel(data);
  }
  return data;
};

module.exports = { snakeToCamelData };
