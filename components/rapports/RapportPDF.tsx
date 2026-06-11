'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '2 solid #1F4E79',
  },
  appName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#1F4E79',
    marginBottom: 4,
  },
  mandatTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: '#64748B',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1F4E79',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottom: '1 solid #E2E8F0',
    textTransform: 'uppercase',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 10,
    border: '1 solid #E2E8F0',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1F4E79',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 8,
    color: '#64748B',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1F4E79',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: '1 solid #E2E8F0',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  tableCell: {
    fontSize: 9,
    color: '#1E293B',
  },
  col1: { width: '8%' },
  col2: { width: '25%' },
  col3: { width: '12%' },
  col4: { width: '18%' },
  col5: { width: '37%' },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1 solid #E2E8F0',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  distLabel: {
    width: 60,
    fontSize: 8,
    color: '#64748B',
  },
  distBar: {
    height: 10,
    borderRadius: 3,
    backgroundColor: '#1F4E79',
  },
  distCount: {
    fontSize: 8,
    color: '#64748B',
    marginLeft: 4,
  },
  genreRow: {
    flexDirection: 'row',
    gap: 16,
  },
  genreItem: {
    alignItems: 'center',
  },
  genreValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1F4E79',
  },
  genreLabel: {
    fontSize: 8,
    color: '#64748B',
  },
  natRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 8,
  },
  natLabel: {
    width: 100,
    fontSize: 8,
    color: '#1E293B',
  },
  natBar: {
    height: 8,
    borderRadius: 3,
    backgroundColor: '#2E75B6',
  },
  natCount: {
    fontSize: 8,
    color: '#64748B',
    marginLeft: 4,
  },
})

const recLabels: Record<string, string> = {
  A_RETENIR: 'À retenir',
  A_ETUDIER: 'À étudier',
  NON_RETENU: 'Non retenu',
}

const recColors: Record<string, string> = {
  A_RETENIR: '#16A34A',
  A_ETUDIER: '#EA580C',
  NON_RETENU: '#DC2626',
}

interface RapportPDFProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mandat: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stats: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shortlists: any[]
  cabinetNom?: string
}

export default function RapportPDF({ mandat, stats, shortlists, cabinetNom }: RapportPDFProps) {
  const maxDist = Math.max(...stats.distributionScores.map((d: { count: number }) => d.count), 1)
  const maxNat = Math.max(...(stats.topNationalites?.map((n: { count: number }) => n.count) ?? [1]), 1)
  const genreTotal = (stats.repartitionGenre.M + stats.repartitionGenre.F + stats.repartitionGenre.Inconnu) || 1
  const now = new Date().toLocaleDateString('fr-FR')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>SoftTalent{cabinetNom ? ` — ${cabinetNom}` : ''}</Text>
          <Text style={styles.mandatTitle}>{mandat.ref} — {mandat.poste}</Text>
          <Text style={styles.subtitle}>{mandat.client?.nom} • Rapport généré le {now}</Text>
        </View>

        {/* Section 1: KPIs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé exécutif</Text>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{stats.totalCandidatures}</Text>
              <Text style={styles.kpiLabel}>Candidatures reçues</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{stats.scoreMoyen ?? '—'}</Text>
              <Text style={styles.kpiLabel}>Score moyen</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{stats.scoreMax ?? '—'}</Text>
              <Text style={styles.kpiLabel}>Score max</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{stats.nbARetenir}</Text>
              <Text style={styles.kpiLabel}>À retenir</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Genre */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Répartition par genre</Text>
          <View style={styles.genreRow}>
            <View style={styles.genreItem}>
              <Text style={styles.genreValue}>{stats.repartitionGenre.M}</Text>
              <Text style={styles.genreLabel}>Hommes ({Math.round((stats.repartitionGenre.M / genreTotal) * 100)}%)</Text>
            </View>
            <View style={styles.genreItem}>
              <Text style={styles.genreValue}>{stats.repartitionGenre.F}</Text>
              <Text style={styles.genreLabel}>Femmes ({Math.round((stats.repartitionGenre.F / genreTotal) * 100)}%)</Text>
            </View>
            <View style={styles.genreItem}>
              <Text style={styles.genreValue}>{stats.repartitionGenre.Inconnu}</Text>
              <Text style={styles.genreLabel}>Non précisé</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Score distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribution des scores</Text>
          {stats.distributionScores.map((d: { tranche: string; count: number }) => (
            <View key={d.tranche} style={styles.distRow}>
              <Text style={styles.distLabel}>{d.tranche}</Text>
              <View style={[styles.distBar, { width: Math.max((d.count / maxDist) * 200, d.count > 0 ? 4 : 0) }]} />
              <Text style={styles.distCount}>{d.count}</Text>
            </View>
          ))}
        </View>

        {/* Section 4: Nationalités */}
        {stats.topNationalites?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top nationalités</Text>
            {stats.topNationalites.map((n: { nationalite: string; count: number }) => (
              <View key={n.nationalite} style={styles.natRow}>
                <Text style={styles.natLabel}>{n.nationalite}</Text>
                <View style={[styles.natBar, { width: Math.max((n.count / maxNat) * 180, 4) }]} />
                <Text style={styles.natCount}>{n.count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Section 5: Shortlist */}
        {shortlists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shortlist recommandée</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.col1]}>#</Text>
                <Text style={[styles.tableHeaderCell, styles.col2]}>Nom Prénom</Text>
                <Text style={[styles.tableHeaderCell, styles.col3]}>Score</Text>
                <Text style={[styles.tableHeaderCell, styles.col4]}>Recommandation</Text>
                <Text style={[styles.tableHeaderCell, styles.col5]}>Point fort clé</Text>
              </View>
              {shortlists.map((s: { id: number; rang: number; candidature: { prenom: string; nom: string; score: number | null; recommendation: string; pointsForts: string[] } }, i: number) => {
                const pts = (s.candidature.pointsForts as string[]) ?? []
                return (
                  <View key={s.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                    <Text style={[styles.tableCell, styles.col1]}>{s.rang}</Text>
                    <Text style={[styles.tableCell, styles.col2]}>
                      {s.candidature.prenom} {s.candidature.nom}
                    </Text>
                    <Text style={[styles.tableCell, styles.col3]}>
                      {s.candidature.score ? Math.round(s.candidature.score) : '—'}/100
                    </Text>
                    <Text style={[styles.tableCell, styles.col4, { color: recColors[s.candidature.recommendation] ?? '#64748B' }]}>
                      {recLabels[s.candidature.recommendation] ?? s.candidature.recommendation}
                    </Text>
                    <Text style={[styles.tableCell, styles.col5]}>
                      {pts[0] ?? '—'}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>CONFIDENTIEL — SoftTalent</Text>
          <Text style={styles.footerText}>{mandat.ref} · {now}</Text>
        </View>
      </Page>
    </Document>
  )
}
