import exportHandler from '../api/corrections/export.ts';

async function testExport() {
  console.log('Testing Export Endpoint...');

  // Test JSON format
  let jsonResult = '';
  const mockReqJson: any = {
    method: 'GET',
    query: { format: 'json', status: 'all' },
    headers: {}
  };
  const mockResJson: any = {
    headers: {},
    setHeader(key: string, val: string) {
      this.headers[key] = val;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      jsonResult = JSON.stringify(data);
      return this;
    },
    send(content: string) {
      jsonResult = content;
      return this;
    }
  };

  await exportHandler(mockReqJson, mockResJson);
  const parsed = JSON.parse(jsonResult);
  console.log('JSON Export Manifest:');
  console.log('- Total Samples:', parsed.totalCorrections);
  console.log('- Dataset Name:', parsed.datasetName);
  console.log('- First Sample Label:', parsed.samples[0]?.label);
  if (!parsed.samples || parsed.samples.length === 0) {
    throw new Error('Export JSON returned 0 samples!');
  }
  console.log('✓ JSON Export verified');

  // Test CSV format
  let csvResult = '';
  const mockReqCsv: any = {
    method: 'GET',
    query: { format: 'csv', status: 'all' },
    headers: {}
  };
  const mockResCsv: any = {
    headers: {},
    setHeader(key: string, val: string) {
      this.headers[key] = val;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(content: string) {
      csvResult = content;
      return this;
    }
  };

  await exportHandler(mockReqCsv, mockResCsv);
  console.log('CSV Export Header:');
  console.log(csvResult.split('\n')[0]);
  console.log('CSV Rows Count:', csvResult.trim().split('\n').length);
  if (csvResult.trim().split('\n').length < 2) {
    throw new Error('Export CSV returned fewer than 2 rows!');
  }
  console.log('✓ CSV Export verified');
  console.log('=== EXPORT TESTS PASSED ===');
}

testExport().catch((e) => {
  console.error(e);
  process.exit(1);
});
