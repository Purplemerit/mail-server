const dns = require('dns').promises;
const logger = require('./logger');

class DNSHelper {
  async checkMXRecords(domain) {
    try {
      const addresses = await dns.resolveMx(domain);
      return {
        success: true,
        records: addresses.sort((a, b) => a.priority - b.priority),
        hasMX: addresses.length > 0
      };
    } catch (error) {
      logger.error(`Failed to resolve MX for ${domain}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        hasMX: false
      };
    }
  }

  async checkSPF(domain) {
    try {
      const records = await dns.resolveTxt(domain);
      const spfRecords = records
        .flat()
        .filter(record => record.startsWith('v=spf1'));

      return {
        success: true,
        hasSPF: spfRecords.length > 0,
        records: spfRecords
      };
    } catch (error) {
      logger.error(`Failed to resolve SPF for ${domain}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        hasSPF: false
      };
    }
  }

  async checkDKIM(domain, selector = 'default') {
    try {
      const dkimDomain = `${selector}._domainkey.${domain}`;
      const records = await dns.resolveTxt(dkimDomain);

      return {
        success: true,
        hasDKIM: records.length > 0,
        records: records.flat()
      };
    } catch (error) {
      logger.error(`Failed to resolve DKIM for ${domain}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        hasDKIM: false
      };
    }
  }

  async checkDMARC(domain) {
    try {
      const dmarcDomain = `_dmarc.${domain}`;
      const records = await dns.resolveTxt(dmarcDomain);
      const dmarcRecords = records
        .flat()
        .filter(record => record.startsWith('v=DMARC1'));

      return {
        success: true,
        hasDMARC: dmarcRecords.length > 0,
        records: dmarcRecords
      };
    } catch (error) {
      logger.error(`Failed to resolve DMARC for ${domain}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        hasDMARC: false
      };
    }
  }

  async checkReverseDNS(ip) {
    try {
      const hostnames = await dns.reverse(ip);
      return {
        success: true,
        hasReverseDNS: hostnames.length > 0,
        hostnames
      };
    } catch (error) {
      logger.error(`Failed to resolve reverse DNS for ${ip}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        hasReverseDNS: false
      };
    }
  }

  async checkAllRecords(domain, options = {}) {
    const { ip, dkimSelector = 'default' } = options;

    const [mx, spf, dkim, dmarc, reverseDNS] = await Promise.all([
      this.checkMXRecords(domain),
      this.checkSPF(domain),
      this.checkDKIM(domain, dkimSelector),
      this.checkDMARC(domain),
      ip ? this.checkReverseDNS(ip) : Promise.resolve({ success: true, hasReverseDNS: false })
    ]);

    const score = [
      mx.hasMX ? 20 : 0,
      spf.hasSPF ? 20 : 0,
      dkim.hasDKIM ? 20 : 0,
      dmarc.hasDMARC ? 20 : 0,
      reverseDNS.hasReverseDNS ? 20 : 0
    ].reduce((a, b) => a + b, 0);

    return {
      domain,
      score,
      status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
      checks: {
        mx,
        spf,
        dkim,
        dmarc,
        reverseDNS
      },
      recommendations: this.getRecommendations({ mx, spf, dkim, dmarc, reverseDNS })
    };
  }

  getRecommendations(checks) {
    const recommendations = [];

    if (!checks.mx.hasMX) {
      recommendations.push({
        priority: 'high',
        type: 'MX',
        message: 'Add MX records to receive emails',
        example: 'example.com. IN MX 10 mail.example.com.'
      });
    }

    if (!checks.spf.hasSPF) {
      recommendations.push({
        priority: 'high',
        type: 'SPF',
        message: 'Add SPF record to prevent email spoofing',
        example: 'v=spf1 mx ip4:YOUR_SERVER_IP ~all'
      });
    }

    if (!checks.dkim.hasDKIM) {
      recommendations.push({
        priority: 'medium',
        type: 'DKIM',
        message: 'Set up DKIM signing to improve deliverability',
        example: 'Generate DKIM keys and add TXT record at default._domainkey.example.com'
      });
    }

    if (!checks.dmarc.hasDMARC) {
      recommendations.push({
        priority: 'medium',
        type: 'DMARC',
        message: 'Add DMARC policy to protect your domain',
        example: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com'
      });
    }

    if (!checks.reverseDNS.hasReverseDNS) {
      recommendations.push({
        priority: 'low',
        type: 'Reverse DNS',
        message: 'Set up reverse DNS (PTR record) for your mail server IP',
        example: 'Contact your hosting provider to set up PTR record'
      });
    }

    return recommendations;
  }

  generateSPFRecord(options = {}) {
    const { includeIPs = [], includeDomains = [], policy = '~all' } = options;

    const parts = ['v=spf1'];

    if (includeDomains.includes('mx')) {
      parts.push('mx');
    }

    includeIPs.forEach(ip => {
      if (ip.includes(':')) {
        parts.push(`ip6:${ip}`);
      } else {
        parts.push(`ip4:${ip}`);
      }
    });

    includeDomains
      .filter(d => d !== 'mx')
      .forEach(domain => {
        parts.push(`include:${domain}`);
      });

    parts.push(policy);

    return parts.join(' ');
  }

  generateDMARCRecord(options = {}) {
    const {
      policy = 'quarantine',
      reportEmail,
      percentage = 100,
      alignment = 'relaxed'
    } = options;

    const parts = ['v=DMARC1'];

    parts.push(`p=${policy}`);

    if (reportEmail) {
      parts.push(`rua=mailto:${reportEmail}`);
    }

    if (percentage !== 100) {
      parts.push(`pct=${percentage}`);
    }

    if (alignment === 'strict') {
      parts.push('aspf=s');
      parts.push('adkim=s');
    }

    return parts.join('; ');
  }
}

module.exports = new DNSHelper();
