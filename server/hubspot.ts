/**
 * HubSpot Sales Pipeline & MAP Analysis Module
 * 
 * Analyzes HubSpot deals data for:
 * - Sales pipeline health
 * - Conversion metrics
 * - Deal stage analysis
 * - Owner performance
 * - MAP (Marketing Automation Platform) effectiveness
 */

import mysql from 'mysql2/promise';
import type { Connection } from 'mysql2/promise';

let dbConnection: Connection | null = null;

async function getDb() {
  if (!dbConnection) {
    dbConnection = await mysql.createConnection({
      host: 'localhost',
      user: 'workday_user',
      password: 'workday_pass',
      database: 'workday_reporting',
    });
  }
  return dbConnection;
}

export interface DealStageAnalysis {
  stage: string;
  count: number;
  totalValue: number;
  averageValue: number;
  averageDaysInStage: number;
  conversionRate: number;
}

export interface OwnerPerformance {
  owner: string;
  dealsCount: number;
  totalValue: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  averageDealSize: number;
  averageDealCycle: number;
}

export interface MAPAnalysis {
  totalDeals: number;
  dealsBySource: { source: string; count: number; value: number }[];
  dealsByType: { type: string; count: number; value: number }[];
  conversionFunnel: {
    stage: string;
    count: number;
    conversionRate: number;
  }[];
  leadQuality: {
    highValue: number;
    mediumValue: number;
    lowValue: number;
  };
  timeToClose: {
    average: number;
    median: number;
    fastest: number;
    slowest: number;
  };
}

/**
 * Get all deals by stage
 */
export async function getDealsByStage(): Promise<DealStageAnalysis[]> {
  const db = await getDb();
  const query = `
    SELECT 
      dealStage as stage,
      COUNT(*) as count,
      SUM(CAST(REPLACE(REPLACE(amountEur, ',', ''), '"', '') AS DECIMAL(15,2))) as totalValue,
      AVG(CAST(REPLACE(REPLACE(amountEur, ',', ''), '"', '') AS DECIMAL(15,2))) as averageValue,
      AVG(
        CASE 
          WHEN closeDate IS NOT NULL AND closeDate != '' 
          THEN DATEDIFF(STR_TO_DATE(closeDate, '%Y-%m-%d'), STR_TO_DATE(createDate, '%Y-%m-%d'))
          ELSE DATEDIFF(CURDATE(), STR_TO_DATE(createDate, '%Y-%m-%d'))
        END
      ) as avgDaysInStage
    FROM hubspotDeals
    WHERE dealStage IS NOT NULL
    GROUP BY dealStage
    ORDER BY 
      CASE dealStage
        WHEN 'Appointment Scheduled' THEN 1
        WHEN 'Qualified To Buy' THEN 2
        WHEN 'Presentation Scheduled' THEN 3
        WHEN 'Decision Maker Bought-In' THEN 4
        WHEN 'Contract Sent' THEN 5
        WHEN 'Closed Won' THEN 6
        WHEN 'Closed Lost' THEN 7
        ELSE 8
      END
  `;

  const [rows] = await db.execute(query);
  
  const stages = rows as any[];
  const totalDeals = stages.reduce((sum, s) => sum + parseInt(s.count || '0'), 0);

  return stages.map((stage, index) => ({
    stage: stage.stage,
    count: parseInt(stage.count || '0'),
    totalValue: parseFloat(stage.totalValue || '0'),
    averageValue: parseFloat(stage.averageValue || '0'),
    averageDaysInStage: Math.round(parseFloat(stage.avgDaysInStage || '0')),
    conversionRate: totalDeals > 0 ? (parseInt(stage.count || '0') / totalDeals) * 100 : 0,
  }));
}

/**
 * Get owner performance metrics
 */
export async function getOwnerPerformance(): Promise<OwnerPerformance[]> {
  const db = await getDb();
  const query = `
    SELECT 
      dealOwner as owner,
      COUNT(*) as dealsCount,
      SUM(CAST(REPLACE(REPLACE(amountEur, ',', ''), '"', '') AS DECIMAL(15,2))) as totalValue,
      SUM(CASE WHEN dealStage = 'Closed Won' THEN 1 ELSE 0 END) as wonDeals,
      SUM(CASE WHEN dealStage = 'Closed Lost' THEN 1 ELSE 0 END) as lostDeals,
      AVG(CAST(REPLACE(REPLACE(amountEur, ',', ''), '"', '') AS DECIMAL(15,2))) as averageDealSize,
      AVG(
        CASE 
          WHEN closeDate IS NOT NULL AND closeDate != '' 
          THEN DATEDIFF(STR_TO_DATE(closeDate, '%Y-%m-%d'), STR_TO_DATE(createDate, '%Y-%m-%d'))
          ELSE NULL
        END
      ) as averageDealCycle
    FROM hubspotDeals
    WHERE dealOwner IS NOT NULL AND dealOwner != ''
    GROUP BY dealOwner
    ORDER BY totalValue DESC
  `;

  const [rows] = await db.execute(query);
  
  return (rows as any[]).map(row => {
    const wonDeals = parseInt(row.wonDeals || '0');
    const lostDeals = parseInt(row.lostDeals || '0');
    const closedDeals = wonDeals + lostDeals;
    
    return {
      owner: row.owner,
      dealsCount: parseInt(row.dealsCount || '0'),
      totalValue: parseFloat(row.totalValue || '0'),
      wonDeals,
      lostDeals,
      winRate: closedDeals > 0 ? (wonDeals / closedDeals) * 100 : 0,
      averageDealSize: parseFloat(row.averageDealSize || '0'),
      averageDealCycle: Math.round(parseFloat(row.averageDealCycle || '0')),
    };
  });
}

/**
 * Get conversion metrics
 */
export async function getConversionMetrics() {
  const db = await getDb();
  const query = `
    SELECT 
      COUNT(*) as totalDeals,
      SUM(CASE WHEN dealStage = 'Closed Won' THEN 1 ELSE 0 END) as wonDeals,
      SUM(CASE WHEN dealStage = 'Closed Lost' THEN 1 ELSE 0 END) as lostDeals,
      SUM(CASE WHEN dealStage NOT IN ('Closed Won', 'Closed Lost') THEN 1 ELSE 0 END) as openDeals,
      SUM(CASE WHEN dealStage = 'Closed Won' THEN CAST(REPLACE(REPLACE(amountEur, ',', ''), '"', '') AS DECIMAL(15,2)) ELSE 0 END) as wonValue,
      SUM(CASE WHEN dealStage NOT IN ('Closed Won', 'Closed Lost') THEN CAST(REPLACE(REPLACE(amountEur, ',', ''), '"', '') AS DECIMAL(15,2)) ELSE 0 END) as pipelineValue,
      AVG(
        CASE 
          WHEN dealStage = 'Closed Won' AND closeDate IS NOT NULL AND closeDate != ''
          THEN DATEDIFF(STR_TO_DATE(closeDate, '%Y-%m-%d'), STR_TO_DATE(createDate, '%Y-%m-%d'))
          ELSE NULL
        END
      ) as averageWinTime
    FROM hubspotDeals
  `;

  const [rows] = await db.execute(query);
  const data = (rows as any[])[0];

  const totalDeals = parseInt(data.totalDeals || '0');
  const wonDeals = parseInt(data.wonDeals || '0');
  const lostDeals = parseInt(data.lostDeals || '0');
  const closedDeals = wonDeals + lostDeals;

  return {
    totalDeals,
    openDeals: parseInt(data.openDeals || '0'),
    wonDeals,
    lostDeals,
    wonValue: parseFloat(data.wonValue || '0'),
    pipelineValue: parseFloat(data.pipelineValue || '0'),
    winRate: closedDeals > 0 ? (wonDeals / closedDeals) * 100 : 0,
    conversionRate: totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0,
    averageWinTime: Math.round(parseFloat(data.averageWinTime || '0')),
  };
}

/**
 * Get MAP (Marketing Automation Platform) analysis
 */
export async function getMAPAnalysis(): Promise<MAPAnalysis> {
  const db = await getDb();
  
  // Get deals by type
  const typeQuery = `
    SELECT 
      COALESCE(NULLIF(refinedDealType, ''), NULLIF(initialDealType, ''), 'Unknown') as type,
      COUNT(*) as count,
      SUM(CAST(REPLACE(REPLACE(amountEur, ',', ''), '"', '') AS DECIMAL(15,2))) as value
    FROM hubspotDeals
    GROUP BY type
    ORDER BY value DESC
  `;

  const [typeRows] = await db.execute(typeQuery);

  // Get deals by solution type (source)
  const sourceQuery = `
    SELECT 
      COALESCE(NULLIF(typeSolution, ''), 'Unknown') as source,
      COUNT(*) as count,
      SUM(CAST(REPLACE(REPLACE(amountEur, ',', ''), '"', '') AS DECIMAL(15,2))) as value
    FROM hubspotDeals
    GROUP BY source
    ORDER BY value DESC
  `;

  const [sourceRows] = await db.execute(sourceQuery);

  // Get conversion funnel
  const funnelQuery = `
    SELECT 
      dealStage as stage,
      COUNT(*) as count
    FROM hubspotDeals
    GROUP BY dealStage
    ORDER BY 
      CASE dealStage
        WHEN 'Appointment Scheduled' THEN 1
        WHEN 'Qualified To Buy' THEN 2
        WHEN 'Presentation Scheduled' THEN 3
        WHEN 'Decision Maker Bought-In' THEN 4
        WHEN 'Contract Sent' THEN 5
        WHEN 'Closed Won' THEN 6
        ELSE 7
      END
  `;

  const [funnelRows] = await db.execute(funnelQuery);
  const funnel = funnelRows as any[];
  const totalFunnelDeals = funnel.reduce((sum, s) => sum + parseInt(s.count || '0'), 0);

  // Get lead quality distribution
  const qualityQuery = `
    SELECT 
      SUM(CASE WHEN CAST(REPLACE(REPLACE(amountEur, ',', ''), '"', '') AS DECIMAL(15,2)) >= 50000 THEN 1 ELSE 0 END) as highValue,
      SUM(CASE WHEN CAST(REPLACE(REPLACE(amountEur, ',', ''), '"', '') AS DECIMAL(15,2)) BETWEEN 10000 AND 49999 THEN 1 ELSE 0 END) as mediumValue,
      SUM(CASE WHEN CAST(REPLACE(REPLACE(amountEur, ',', ''), '"', '') AS DECIMAL(15,2)) < 10000 THEN 1 ELSE 0 END) as lowValue
    FROM hubspotDeals
  `;

  const [qualityRows] = await db.execute(qualityQuery);
  const quality = (qualityRows as any[])[0];

  // Get time to close metrics
  const timeQuery = `
    SELECT 
      AVG(days) as average,
      MIN(days) as fastest,
      MAX(days) as slowest
    FROM (
      SELECT 
        DATEDIFF(STR_TO_DATE(closeDate, '%Y-%m-%d'), STR_TO_DATE(createDate, '%Y-%m-%d')) as days
      FROM hubspotDeals
      WHERE dealStage = 'Closed Won'
        AND closeDate IS NOT NULL AND closeDate != ''
        AND createDate IS NOT NULL AND createDate != ''
    ) time_data
  `;

  const [timeRows] = await db.execute(timeQuery);
  const timeData = (timeRows as any[])[0];

  // Calculate median
  const medianQuery = `
    SELECT days
    FROM (
      SELECT 
        DATEDIFF(STR_TO_DATE(closeDate, '%Y-%m-%d'), STR_TO_DATE(createDate, '%Y-%m-%d')) as days,
        ROW_NUMBER() OVER (ORDER BY DATEDIFF(STR_TO_DATE(closeDate, '%Y-%m-%d'), STR_TO_DATE(createDate, '%Y-%m-%d'))) as row_num,
        COUNT(*) OVER () as total_count
      FROM hubspotDeals
      WHERE dealStage = 'Closed Won'
        AND closeDate IS NOT NULL AND closeDate != ''
        AND createDate IS NOT NULL AND createDate != ''
    ) ranked
    WHERE row_num = FLOOR((total_count + 1) / 2)
  `;

  const [medianRows] = await db.execute(medianQuery);
  const median = (medianRows as any[])[0]?.days || timeData.average;

  return {
    totalDeals: totalFunnelDeals,
    dealsBySource: (sourceRows as any[]).map(row => ({
      source: row.source,
      count: parseInt(row.count || '0'),
      value: parseFloat(row.value || '0'),
    })),
    dealsByType: (typeRows as any[]).map(row => ({
      type: row.type,
      count: parseInt(row.count || '0'),
      value: parseFloat(row.value || '0'),
    })),
    conversionFunnel: funnel.map((stage, index) => ({
      stage: stage.stage,
      count: parseInt(stage.count || '0'),
      conversionRate: totalFunnelDeals > 0 ? (parseInt(stage.count || '0') / totalFunnelDeals) * 100 : 0,
    })),
    leadQuality: {
      highValue: parseInt(quality.highValue || '0'),
      mediumValue: parseInt(quality.mediumValue || '0'),
      lowValue: parseInt(quality.lowValue || '0'),
    },
    timeToClose: {
      average: Math.round(parseFloat(timeData.average || '0')),
      median: Math.round(parseFloat(median || '0')),
      fastest: parseInt(timeData.fastest || '0'),
      slowest: parseInt(timeData.slowest || '0'),
    },
  };
}

/**
 * Get sales pipeline analysis
 */
export async function getSalesPipelineAnalysis() {
  const stages = await getDealsByStage();
  const owners = await getOwnerPerformance();
  const conversion = await getConversionMetrics();
  const map = await getMAPAnalysis();

  // Calculate pipeline health score (0-100)
  const healthFactors = {
    winRate: Math.min(100, conversion.winRate * 2),
    pipelineValue: Math.min(100, (conversion.pipelineValue / 1000000) * 20),
    dealVelocity: Math.min(100, (365 / Math.max(conversion.averageWinTime, 1)) * 10),
    stageDistribution: stages.length >= 5 ? 100 : (stages.length / 5) * 100,
  };

  const healthScore = Math.round(
    (healthFactors.winRate * 0.3 +
      healthFactors.pipelineValue * 0.3 +
      healthFactors.dealVelocity * 0.2 +
      healthFactors.stageDistribution * 0.2)
  );

  return {
    overview: {
      healthScore,
      totalPipelineValue: conversion.pipelineValue,
      wonValue: conversion.wonValue,
      openDeals: conversion.openDeals,
      winRate: conversion.winRate,
      averageDealCycle: conversion.averageWinTime,
    },
    stages,
    topOwners: owners.slice(0, 10),
    conversion,
    map,
  };
}
