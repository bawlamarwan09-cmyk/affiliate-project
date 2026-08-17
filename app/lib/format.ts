export const formatUSD=(value:unknown)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2}).format(Number(value));
export const formatDate=(value:string|Date,options:Intl.DateTimeFormatOptions={year:"numeric",month:"long",day:"numeric"})=>new Intl.DateTimeFormat("en-US",options).format(new Date(value));
