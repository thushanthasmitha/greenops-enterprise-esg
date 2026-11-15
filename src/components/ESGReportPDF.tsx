import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { EmissionRecord } from '../types/esg';

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#065f46', marginBottom: 4 },
  subHeader: { fontSize: 10, color: '#4b5563', marginBottom: 20 },
  summaryBox: { padding: 12, backgroundColor: '#ecfdf5', borderRadius: 6, marginBottom: 20, border: '1pt solid #10b981' },
  summaryText: { fontSize: 12, fontWeight: 'bold', color: '#065f46' },
  table: { display: 'flex', width: 'auto', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', alignItems: 'center', minHeight: 24 },
  tableHeader: { backgroundColor: '#f3f4f6', fontSize: 9, fontWeight: 'bold', color: '#374151', padding: 6 },
  tableCell: { fontSize: 9, color: '#4b5563', padding: 6 },
});

interface ESGReportPDFProps {
  records: EmissionRecord[];
  totalEmissions: string;
}

export const ESGReportPDF: React.FC<ESGReportPDFProps> = ({ records, totalEmissions }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View>
        <Text style={styles.header}>GreenOps Enterprise ESG Audit Report</Text>
        <Text style={styles.subHeader}>GHG Protocol Aligned Carbon Accounting Ledger | Generated on: {new Date().toISOString().split('T')[0]}</Text>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>Total Certified Carbon Footprint: {totalEmissions} tCO2e</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>Date</Text>
          <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>Scope</Text>
          <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>Category</Text>
          <Text style={[styles.tableCell, { flex: 1.2, fontWeight: 'bold' }]}>Activity</Text>
          <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>CO2e (t)</Text>
          <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>Status</Text>
        </View>

        {records.map((r) => (
          <View key={r.id} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1 }]}>{r.date}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{r.scope}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{r.category}</Text>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>{r.activityAmount.toLocaleString()} {r.unit}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{r.co2eTonnes}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{r.status}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);