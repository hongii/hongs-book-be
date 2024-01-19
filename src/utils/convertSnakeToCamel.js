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

module.exports = { snakeToCamelData };
