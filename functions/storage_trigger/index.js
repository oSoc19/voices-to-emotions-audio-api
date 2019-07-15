// Background Cloud Function to be triggered by Cloud Storage.
exports.storage_trigger = (data, context) => {
  console.log(data);
  console.log(data.name);
  
  if (data.resourceState === "not_exists") {
    console.log(`File ${data.name} deleted.`);
  } else if (data.metageneration === "1") {
    // metageneration attribute is updated on metadata changes.
    // on create value is 1
    console.log(`File ${data.name} uploaded.`);
  } else {
    console.log(`File ${data.name} metadata updated.`);
  }
};
