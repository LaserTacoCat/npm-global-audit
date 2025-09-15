import { Command, flags } from '@oclif/command';
import { performAudit } from './audit';
import { AuditLevelOptions, AuditorOptions } from './types';

class Audit extends Command {
  static description = 'perform an audit of globally installed node_modules';

  static flags = {
    auditor: flags.enum({
      options: ['yarn', 'npm'],
      default: 'yarn',
      char: 'a',
      description: 'which package manager should perform the audit of the global node modules',
    }),
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    'audit-level': flags.enum({
      options: ['info', 'low', 'moderate', 'high', 'critical', 'none'],
      default: null,
      char: 'l',
      description: 'only fail if vulnerabilities of this level or higher are found',
    }),
  };

  static args = [];

  async run() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { flags } = this.parse(Audit);

    const auditResult = await performAudit(flags.auditor as AuditorOptions, flags['audit-level'] as AuditLevelOptions);

    if (auditResult.exitCode === 0) {
      this.log(auditResult.message);
    } else {
      this.error(auditResult.message, { exit: auditResult.exitCode });
    }
  }
}

export = Audit;
