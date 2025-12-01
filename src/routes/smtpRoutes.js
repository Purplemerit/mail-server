const express = require('express');
const router = express.Router();
const dnsHelper = require('../utils/dnsHelper');
const logger = require('../utils/logger');

router.post('/dns/check', async (req, res, next) => {
  try {
    const { domain, ip, dkimSelector } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Domain is required'
      });
    }

    const results = await dnsHelper.checkAllRecords(domain, { ip, dkimSelector });

    res.json({
      success: true,
      results
    });
  } catch (error) {
    logger.error('Error checking DNS:', error);
    next(error);
  }
});

router.post('/dns/generate-spf', (req, res) => {
  try {
    const { includeIPs, includeDomains, policy } = req.body;

    const spfRecord = dnsHelper.generateSPFRecord({
      includeIPs,
      includeDomains,
      policy
    });

    res.json({
      success: true,
      record: spfRecord,
      instructions: {
        type: 'TXT',
        name: '@',
        value: spfRecord,
        ttl: '3600'
      }
    });
  } catch (error) {
    logger.error('Error generating SPF:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/dns/generate-dmarc', (req, res) => {
  try {
    const { policy, reportEmail, percentage, alignment } = req.body;

    const dmarcRecord = dnsHelper.generateDMARCRecord({
      policy,
      reportEmail,
      percentage,
      alignment
    });

    res.json({
      success: true,
      record: dmarcRecord,
      instructions: {
        type: 'TXT',
        name: '_dmarc',
        value: dmarcRecord,
        ttl: '3600'
      }
    });
  } catch (error) {
    logger.error('Error generating DMARC:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/dns/mx/:domain', async (req, res, next) => {
  try {
    const result = await dnsHelper.checkMXRecords(req.params.domain);
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Error checking MX:', error);
    next(error);
  }
});

router.get('/dns/spf/:domain', async (req, res, next) => {
  try {
    const result = await dnsHelper.checkSPF(req.params.domain);
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Error checking SPF:', error);
    next(error);
  }
});

router.get('/dns/dkim/:domain/:selector?', async (req, res, next) => {
  try {
    const { domain, selector = 'default' } = req.params;
    const result = await dnsHelper.checkDKIM(domain, selector);
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Error checking DKIM:', error);
    next(error);
  }
});

router.get('/dns/dmarc/:domain', async (req, res, next) => {
  try {
    const result = await dnsHelper.checkDMARC(req.params.domain);
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Error checking DMARC:', error);
    next(error);
  }
});

module.exports = router;
